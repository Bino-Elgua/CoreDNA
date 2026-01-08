import { useState, useEffect } from 'react';
import { useVoiceListener } from '../hooks/useVoiceListener';
import { sonicCoPilot } from '../services/sonicCoPilot';
import { toastService } from '../services/toastService';

export function SonicOrb() {
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'sonic'; text: string }>>([]);

  const { isListening, isSupported, startListening, stopListening } = useVoiceListener({
    continuous: false,
    onResult: async (transcript) => {
      // Check if command starts with "Sonic"
      if (transcript.toLowerCase().startsWith('sonic')) {
        const command = transcript.slice(6).trim(); // Remove "Sonic, " prefix
        await handleCommand(command);
      }
    },
    onError: (error) => {
      toastService.showToast(`Voice error: ${error}`, 'error');
    }
  });

  // Initialize Sonic on mount
  useEffect(() => {
    sonicCoPilot.initialize().then(setIsInitialized);
  }, []);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCommand = async (input: string) => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: input }]);

    // Process command
    const response = await sonicCoPilot.processCommand(input);

    // Add Sonic response
    setMessages(prev => [...prev, { role: 'sonic', text: response }]);

    // Speak response if voice is active
    if (isListening) {
      speakText(response);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      sonicCoPilot.setListening(false);
      stopListening();
    } else {
      sonicCoPilot.setListening(true);
      startListening();
      toastService.showToast('🎤 Listening... Say "Sonic, [command]"', 'info');
    }
  };

  if (!isInitialized) {
    return null; // Don't show if not initialized (tier check failed)
  }

  return (
    <>
      {/* Floating Orb */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowChat(!showChat)}
          className={`
            w-16 h-16 rounded-full shadow-2xl
            flex items-center justify-center
            transition-all duration-300
            ${isListening 
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-110'
            }
          `}
        >
          <span className="text-2xl">🎙️</span>
        </button>

        {isSupported && (
          <button
            onClick={toggleVoice}
            title={isListening ? 'Stop listening' : 'Start voice control'}
            className={`
              absolute -top-2 -left-2 w-8 h-8 rounded-full
              flex items-center justify-center shadow-lg
              ${isListening ? 'bg-red-500' : 'bg-green-500'}
              hover:scale-110 transition-transform
            `}
          >
            <span className="text-xs">{isListening ? '⏸️' : '▶️'}</span>
          </button>
        )}
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎙️</span>
              <div>
                <h3 className="font-semibold text-white">Sonic Co-Pilot</h3>
                <p className="text-xs text-blue-100">
                  {isListening ? 'Listening...' : 'Ready to assist'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-sm">Say "Sonic, help" or type a command below</p>
                <p className="text-xs mt-2">Try: "Extract apple.com" or "Show stats"</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`
                  flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}
                `}
              >
                <div
                  className={`
                    max-w-[80%] px-4 py-2 rounded-lg
                    ${msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chatInput.trim()) {
                  handleCommand(chatInput);
                  setChatInput('');
                }
              }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a command..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
