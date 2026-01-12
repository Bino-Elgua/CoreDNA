import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sonicChat, SonicMessage } from '../services/sonicCoPilot';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
}

export const SonicOrb: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'bot', text: 'Hey! I\'m Sonic Co-Pilot. I can help you navigate CoreDNA, explain features, or answer questions. What would you like to do?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<SonicMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Update conversation history
    const newHistory: SonicMessage[] = [
      ...conversationHistory,
      { role: 'user', content: input }
    ];
    setConversationHistory(newHistory);
    setInput('');
    setLoading(true);

    try {
      // Get LLM response with context
      const { response, action } = await sonicChat(
        input,
        conversationHistory,
        user?.tier || 'free'
      );
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: response
      };
      setMessages(prev => [...prev, botMsg]);
      
      // Update conversation history with bot response
      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: response }
      ]);
      
      // Execute action if present
      if (action?.type === 'navigate' && action.target) {
        setTimeout(() => {
          navigate(action.target!);
          setIsOpen(false);
        }, 500);
      }
    } catch (e: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: `Error: ${e.message || 'Failed to process request'}`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Only show for agency tier (demo user)
  if (!user || user.tier !== 'agency') {
    return null;
  }

  return (
    <>
      {/* Floating Orb Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-lg transition-all duration-300 z-40 flex items-center justify-center text-2xl bg-gradient-to-br from-purple-500 to-blue-500 hover:shadow-2xl"
        title="Sonic Co-Pilot"
      >
        🎙️
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 w-96 h-96 bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl z-40 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Sonic Co-Pilot</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-800">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  msg.type === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg text-sm">
                  <span className="animate-pulse">Sonic thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700 p-4 space-y-2 bg-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type command..."
                disabled={loading}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
