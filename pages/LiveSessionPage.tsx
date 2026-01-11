
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { useAuth } from '../contexts/AuthContext';
import { BrandDNA } from '../types';
import { useNavigate } from 'react-router-dom';

// --- Audio Utilities (PCM Handling) ---

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const LiveSessionPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // State
    const [isConnected, setIsConnected] = useState(false);
    const [isTalking, setIsTalking] = useState(false); // Brand is talking
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [dna, setDna] = useState<BrandDNA | null>(null);

    // Refs for Audio Contexts & WebSockets
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    // Visualizer State
    const [volume, setVolume] = useState(0);

    // Load active DNA
    useEffect(() => {
        const stored = localStorage.getItem('core_dna_profiles');
        if (stored) {
            try {
                const profiles = JSON.parse(stored);
                if (profiles.length > 0) setDna(profiles[0]);
            } catch(e) {}
        }
    }, []);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

    const connect = async () => {
        if (!dna) return;
        setError(null);
        addLog("Initializing Audio Context...");

        try {
            // 1. Setup Audio Input (Microphone)
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    sampleRate: 16000, 
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
            mediaStreamRef.current = stream;

            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = audioCtx;
            nextStartTimeRef.current = audioCtx.currentTime;

            // 2. Initialize Gemini Client - get from settings, not environment
            const settings = JSON.parse(localStorage.getItem('core_dna_settings') || '{}');
            const geminiKey = settings.llms?.google?.apiKey || settings.llms?.gemini?.apiKey || '';
            if (!geminiKey) {
              addLog('Error: No Gemini API key configured. Please add it in Settings → API Keys');
              return;
            }
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            
            addLog("Connecting to Gemini Live...");
            
            // 3. System Instruction
            const systemInstruction = `
                You are the physical embodiment of the brand "${dna.name}".
                Tone: ${dna.toneOfVoice.description}.
                Mission: ${dna.mission}.
                Speak concisely, professionally, but with the distinct personality defined above.
                Do not mention you are an AI. You are the brand.
            `;

            // 4. Connect Session
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: systemInstruction,
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // 'Kore' is usually good for neutral/brand
                    }
                },
                callbacks: {
                    onopen: () => {
                        setIsConnected(true);
                        addLog("Connected! Listening...");
                        startAudioInput(stream, audioCtx);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            setIsTalking(true);
                            await queueAudioOutput(audioData, audioCtx);
                        }
                        
                        if (msg.serverContent?.turnComplete) {
                            setIsTalking(false);
                        }
                    },
                    onclose: () => {
                        setIsConnected(false);
                        addLog("Session Closed.");
                        stopAudio();
                    },
                    onerror: (err) => {
                        console.error(err);
                        setError("Connection Error. Check console.");
                        stopAudio();
                    }
                }
            });

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to connect to microphone.");
        }
    };

    const startAudioInput = (stream: MediaStream, audioCtx: AudioContext) => {
        // Create a separate context for input to ensure 16kHz if possible, 
        // or just downsample. Gemini Live prefers 16kHz input.
        // For simplicity in this demo, we rely on the browser to handle sampling, 
        // but we process chunks.
        
        // We need a separate input context usually if rates differ, but let's try sharing or using the stream track.
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Simple visualizer volume check
            let sum = 0;
            for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            setVolume(rms * 100); // Scale up

            // Convert to 16-bit PCM for Gemini
            const pcm16 = floatTo16BitPCM(inputData);
            const base64 = arrayBufferToBase64(pcm16.buffer);

            // Send
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: "audio/pcm;rate=16000",
                            data: base64
                        }
                    });
                });
            }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination); // destination is mute for ScriptProcessor usually

        sourceRef.current = source;
        processorRef.current = processor;
    };

    const queueAudioOutput = async (base64Audio: string, ctx: AudioContext) => {
        try {
            const pcmData = base64ToUint8Array(base64Audio);
            const float32Data = new Float32Array(pcmData.length / 2);
            const dataView = new DataView(pcmData.buffer);

            for (let i = 0; i < pcmData.length / 2; i++) {
                const int16 = dataView.getInt16(i * 2, true); // Little endian
                float32Data[i] = int16 / 32768.0;
            }

            const buffer = ctx.createBuffer(1, float32Data.length, 24000);
            buffer.copyToChannel(float32Data, 0);

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);

            const now = ctx.currentTime;
            // Schedule
            // nextStartTime must be at least 'now'
            const startTime = Math.max(now, nextStartTimeRef.current);
            source.start(startTime);
            
            // Update next start time
            nextStartTimeRef.current = startTime + buffer.duration;

        } catch (e) {
            console.error("Audio Decode Error", e);
        }
    };

    const stopAudio = () => {
        sourceRef.current?.disconnect();
        processorRef.current?.disconnect();
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
        audioContextRef.current?.close();
        
        setIsConnected(false);
        setIsTalking(false);
        setVolume(0);
    };

    const handleDisconnect = () => {
        // There is no explicit .close() on the session object exposed by the promise wrapper easily 
        // without keeping the session object in state.
        // For this pattern, refreshing or stopping streams is the clean way.
        stopAudio();
    };

    const handleBack = () => {
        stopAudio();
        navigate(-1);
    }

    useEffect(() => {
        return () => stopAudio();
    }, []);

    if (!dna) return <div className="h-screen flex items-center justify-center text-white bg-black">Load a profile first.</div>;

    return (
        <div className="h-[calc(100vh-64px)] bg-black text-white relative overflow-hidden flex flex-col items-center justify-center">
            {/* Back Button */}
            <div className="absolute top-4 left-4 z-50">
                <button 
                    onClick={handleBack} 
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-black/50 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back
                </button>
            </div>

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black pointer-events-none" />
            
            {/* Active Orb Visualizer */}
            <div className="relative z-10 text-center">
                <div className={`transition-all duration-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-40 ${isTalking ? 'bg-dna-primary w-96 h-96' : 'bg-dna-secondary w-64 h-64'}`}></div>
                
                <div className="relative z-20">
                    <motion.div 
                        animate={{ 
                            scale: isConnected ? 1 + (volume / 20) : 1,
                            borderColor: isTalking ? '#8b5cf6' : 'rgba(255,255,255,0.2)'
                        }}
                        className="w-48 h-48 rounded-full border-4 flex items-center justify-center backdrop-blur-md bg-black/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] mx-auto mb-10 transition-colors duration-300"
                    >
                        {isTalking ? (
                            <div className="flex gap-1 h-12 items-center">
                                {[1,2,3,4,5].map(i => (
                                    <motion.div 
                                        key={i}
                                        animate={{ height: [10, 40, 10] }}
                                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                        className="w-2 bg-white rounded-full"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-6xl font-bold opacity-50">
                                {dna.name.charAt(0)}
                            </div>
                        )}
                    </motion.div>
                </div>

                <h1 className="text-4xl font-display font-bold mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    {dna.name} Live
                </h1>
                
                <p className="text-gray-400 mb-12 max-w-md mx-auto text-sm font-mono h-6">
                    {error ? <span className="text-red-500">{error}</span> : logs[0] || "Ready to connect..."}
                </p>

                {!isConnected ? (
                    <button 
                        onClick={connect}
                        className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            Start Session
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-dna-primary to-dna-secondary opacity-0 group-hover:opacity-20 transition-opacity" />
                    </button>
                ) : (
                    <button 
                        onClick={handleDisconnect}
                        className="px-8 py-4 bg-red-500/20 text-red-500 border border-red-500/50 rounded-full font-bold text-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 mx-auto"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        End Session
                    </button>
                )}
                
                <div className="mt-12 text-[10px] text-gray-600 font-mono">
                    POWERED BY GEMINI 2.5 FLASH AUDIO
                </div>
            </div>
        </div>
    );
};

export default LiveSessionPage;
