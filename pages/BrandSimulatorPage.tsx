
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA } from '../types';
import { createBrandChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

const BrandSimulatorPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dna: BrandDNA | null = location.state?.dna;

    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!dna) {
            navigate('/dashboard');
            return;
        }

        // Initialize Chat
        try {
            const session = createBrandChat(dna);
            setChatSession(session);
            
            // Initial greeting from the brand
            setMessages([{
                id: 'init',
                role: 'model',
                text: `Hello! I am ${dna.name}. How can I assist you today?`,
                timestamp: Date.now()
            }]);
        } catch (e) {
            console.error(e);
            alert("Failed to initialize simulator.");
        }
    }, [dna, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chatSession) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);

        try {
            const result: GenerateContentResponse = await chatSession.sendMessage({ message: userMsg.text });
            const responseText = result.text || "I'm not sure how to respond to that in my brand voice.";
            
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText,
                timestamp: Date.now()
            }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "[System Error: Failed to maintain brand connection.]",
                timestamp: Date.now()
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!dna) return null;

    return (
        <div className="container mx-auto px-4 py-8 h-[calc(100vh-80px)] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                        <span className="text-gray-400 font-normal">Simulating:</span> 
                        <span className="text-dna-primary">{dna.name}</span>
                    </h1>
                    <p className="text-xs text-gray-500">Tone: {dna.toneOfVoice.adjectives.join(', ')}</p>
                </div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Exit Simulator
                </button>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
                
                {/* Visualizer / Vibe Check Header */}
                <div className="h-16 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center px-6 justify-between relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                         {/* Animated background to represent "Thinking" or "Alive" state */}
                         <div className={`w-full h-full bg-gradient-to-r from-dna-primary to-dna-secondary animate-pulse-slow ${isThinking ? 'opacity-100 duration-500' : 'opacity-20'}`} />
                    </div>
                    <div className="relative z-10 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                             {dna.visualIdentityExtended?.logoUrl ? (
                                 <img src={dna.visualIdentityExtended.logoUrl} className="w-8 h-8 object-contain" alt="Logo" />
                             ) : (
                                 <span className="text-lg font-bold text-white">{dna.name.charAt(0)}</span>
                             )}
                         </div>
                         <div>
                             <h3 className="text-white font-bold text-sm">{dna.name} AI</h3>
                             <span className="flex items-center gap-1.5 text-[10px] text-green-400">
                                 <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                 Online
                             </span>
                         </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-900/50">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div 
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-dna-primary text-white rounded-tr-sm' 
                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {isThinking && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                             <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700 flex gap-1 items-center">
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                             </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                    <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Message ${dna.name}...`}
                            className="w-full p-4 pr-12 rounded-xl bg-gray-100 dark:bg-gray-900 border-none focus:ring-2 focus:ring-dna-primary outline-none resize-none max-h-32 min-h-[56px] custom-scrollbar"
                            rows={1}
                            autoFocus
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isThinking}
                            className="absolute right-2 bottom-2 p-2 bg-dna-primary text-white rounded-lg hover:bg-dna-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 mt-2">
                        Simulating brand voice based on extracted DNA. Responses are AI-generated.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BrandSimulatorPage;
