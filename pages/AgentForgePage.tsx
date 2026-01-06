
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandDNA, AgentRole, AgentGuardrails } from '../types';
import { generateAgentSystemPrompt, createAgentChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import { FADE_IN_UP } from '../constants';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'system' | 'user' | 'agent' | 'error';
  label: string;
  message: string;
  meta?: string;
}

const AgentForgePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [selectedDNA, setSelectedDNA] = useState<BrandDNA | null>(null);
  const [activeTab, setActiveTab] = useState<'configure' | 'test' | 'deploy'>('configure');
  
  // Config State
  const [role, setRole] = useState<AgentRole>('support');
  const [guardrails, setGuardrails] = useState<AgentGuardrails>({
    strictness: 'medium',
    forbiddenTopics: [],
    requiredPhrases: [],
    knowledgeBaseLimit: true
  });
  
  // Inputs
  const [forbiddenInput, setForbiddenInput] = useState('');
  const [requiredInput, setRequiredInput] = useState('');

  // Generated Artifacts
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // Chat Test State
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // Debug State
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Load DNA
  useEffect(() => {
    if (location.state?.dna) {
        setSelectedDNA(location.state.dna);
    } else {
        const stored = localStorage.getItem('core_dna_profiles');
        if (stored) {
            try {
                const profiles = JSON.parse(stored);
                if (profiles.length > 0) setSelectedDNA(profiles[0]);
            } catch(e) {}
        }
    }
  }, [location.state]);

  // Generate Prompt on change
  useEffect(() => {
    if (selectedDNA) {
        const prompt = generateAgentSystemPrompt(selectedDNA, role, guardrails);
        setSystemPrompt(prompt);
        // Reset chat when config changes
        setChatSession(null);
        setMessages([]);
        setLogs([]);
    }
  }, [selectedDNA, role, guardrails]);

  // Scroll chat
  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll logs
  useEffect(() => {
      if (showDebug) {
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [logs, showDebug]);

  const addLog = (type: LogEntry['type'], label: string, message: string, meta?: string) => {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      setLogs(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: time,
          type,
          label,
          message,
          meta
      }]);
  };

  const handleAddItem = (type: 'forbidden' | 'required') => {
      if (type === 'forbidden' && forbiddenInput) {
          setGuardrails(prev => ({ ...prev, forbiddenTopics: [...prev.forbiddenTopics, forbiddenInput] }));
          setForbiddenInput('');
      } else if (type === 'required' && requiredInput) {
          setGuardrails(prev => ({ ...prev, requiredPhrases: [...prev.requiredPhrases, requiredInput] }));
          setRequiredInput('');
      }
  };

  const handleRemoveItem = (type: 'forbidden' | 'required', index: number) => {
      if (type === 'forbidden') {
          setGuardrails(prev => ({ ...prev, forbiddenTopics: prev.forbiddenTopics.filter((_, i) => i !== index) }));
      } else {
          setGuardrails(prev => ({ ...prev, requiredPhrases: prev.requiredPhrases.filter((_, i) => i !== index) }));
      }
  };

  const initChat = () => {
      try {
          setLogs([]);
          addLog('system', 'INIT', 'Initializing Agent Session...');
          const session = createAgentChat(systemPrompt);
          setChatSession(session);
          setMessages([{ role: 'model', text: `[SYSTEM: Agent Initialized with Role: ${role.toUpperCase()}] Ready.`}]);
          
          addLog('system', 'CONFIG', `Role set to ${role}`);
          addLog('system', 'CONFIG', `Strictness: ${guardrails.strictness}`);
          addLog('system', 'CONFIG', `Knowledge Base Limit: ${guardrails.knowledgeBaseLimit}`);
          addLog('system', 'READY', 'Session established. Waiting for input.');
      } catch (e: any) {
          console.error(e);
          addLog('error', 'INIT_FAIL', e.message || 'Unknown Error');
      }
  };

  const handleSendMessage = async () => {
      if (!inputMsg || !chatSession) return;
      const userText = inputMsg;
      setMessages(prev => [...prev, { role: 'user', text: userText }]);
      setInputMsg('');
      setIsThinking(true);

      const startTime = Date.now();
      addLog('user', 'INPUT', userText);
      addLog('system', 'PROCESSING', 'Sending request to LLM...');

      try {
          const result: GenerateContentResponse = await chatSession.sendMessage({ message: userText });
          const latency = Date.now() - startTime;
          const responseText = result.text || "..."
          
          setMessages(prev => [...prev, { role: 'model', text: responseText }]);
          addLog('agent', 'OUTPUT', responseText.substring(0, 50) + (responseText.length > 50 ? '...' : ''), `Latency: ${latency}ms | Chars: ${responseText.length}`);
      } catch (e: any) {
          setMessages(prev => [...prev, { role: 'model', text: "Error generating response." }]);
          addLog('error', 'GEN_FAIL', e.message || 'Generation Failed');
      } finally {
          setIsThinking(false);
      }
  };

  if (!selectedDNA) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Agent Forge</h1>
              <p className="text-gray-500 dark:text-gray-400">Build, test, and deploy AI agents powered by <span className="text-dna-primary font-bold">{selectedDNA.name}</span>'s DNA.</p>
          </div>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-dna-primary transition-colors font-medium group"
          >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[800px]">
          
          {/* LEFT PANEL: CONFIGURATION */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Configuration
                  </h3>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                  {/* Role Selector */}
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Agent Role</label>
                      <div className="grid grid-cols-2 gap-2">
                          {['support', 'sales', 'content_guardian', 'creative_director'].map((r) => (
                              <button 
                                key={r}
                                onClick={() => setRole(r as AgentRole)}
                                className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                                    role === r 
                                    ? 'bg-dna-primary text-white border-dna-primary' 
                                    : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-dna-primary'
                                }`}
                              >
                                  {r.replace('_', ' ').toUpperCase()}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Strictness */}
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Strictness Level</label>
                      <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                          {['low', 'medium', 'high'].map((s) => (
                              <button
                                key={s}
                                onClick={() => setGuardrails(p => ({...p, strictness: s as any}))}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${
                                    guardrails.strictness === s 
                                    ? 'bg-white dark:bg-gray-700 shadow-sm text-dna-secondary' 
                                    : 'text-gray-500'
                                }`}
                              >
                                  {s}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Knowledge Limit */}
                  <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Limit Knowledge to DNA</label>
                      <button 
                        onClick={() => setGuardrails(p => ({...p, knowledgeBaseLimit: !p.knowledgeBaseLimit}))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${guardrails.knowledgeBaseLimit ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                          <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${guardrails.knowledgeBaseLimit ? 'translate-x-6' : ''}`} />
                      </button>
                  </div>

                  {/* Forbidden Topics */}
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Forbidden Topics (Guardrails)</label>
                      <div className="flex gap-2 mb-2">
                          <input 
                            value={forbiddenInput}
                            onChange={(e) => setForbiddenInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem('forbidden')}
                            placeholder="e.g. Competitors, Politics"
                            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:ring-1 focus:ring-red-500 outline-none"
                          />
                          <button onClick={() => handleAddItem('forbidden')} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">+</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {guardrails.forbiddenTopics.map((t, i) => (
                              <span key={i} className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded border border-red-100 dark:border-red-800 flex items-center gap-1">
                                  {t} <button onClick={() => handleRemoveItem('forbidden', i)}>&times;</button>
                              </span>
                          ))}
                      </div>
                  </div>

                  {/* Required Phrasing */}
                  <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Required Phrasing</label>
                      <div className="flex gap-2 mb-2">
                          <input 
                            value={requiredInput}
                            onChange={(e) => setRequiredInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem('required')}
                            placeholder="e.g. 'Have a green day!'"
                            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:ring-1 focus:ring-green-500 outline-none"
                          />
                          <button onClick={() => handleAddItem('required')} className="text-green-500 hover:bg-green-50 p-2 rounded-lg">+</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                          {guardrails.requiredPhrases.map((t, i) => (
                              <span key={i} className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded border border-green-100 dark:border-green-800 flex items-center gap-1">
                                  {t} <button onClick={() => handleRemoveItem('required', i)}>&times;</button>
                              </span>
                          ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* RIGHT PANEL: WORKSPACE (TABS) */}
          <div className="lg:col-span-2 flex flex-col h-full">
              {/* Tab Nav */}
              <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                  {['configure', 'test', 'deploy'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-3 px-2 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${
                            activeTab === tab 
                            ? 'border-dna-primary text-dna-primary' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                          {tab === 'configure' ? 'System Prompt' : tab}
                      </button>
                  ))}
              </div>

              <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative">
                  
                  {/* TAB 1: SYSTEM PROMPT */}
                  {activeTab === 'configure' && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="h-full flex flex-col">
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                              <span className="text-xs text-gray-500">Live Generated System Instruction</span>
                              <button onClick={() => navigator.clipboard.writeText(systemPrompt)} className="text-xs text-dna-primary hover:underline">Copy</button>
                          </div>
                          <textarea 
                            readOnly 
                            value={systemPrompt} 
                            className="flex-1 w-full p-6 bg-gray-50 dark:bg-gray-900 font-mono text-xs text-gray-600 dark:text-gray-300 resize-none outline-none leading-relaxed"
                          />
                      </motion.div>
                  )}

                  {/* TAB 2: TEST DRIVE */}
                  {activeTab === 'test' && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="h-full flex">
                           {!chatSession ? (
                               <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                   <div className="w-16 h-16 bg-dna-primary/10 rounded-full flex items-center justify-center mb-4">
                                       <svg className="w-8 h-8 text-dna-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                   </div>
                                   <h3 className="text-xl font-bold mb-2">Ready to Test</h3>
                                   <p className="text-gray-500 mb-6 max-w-sm">
                                       Initialize the agent with the current configuration. It will adopt the <strong>{role.toUpperCase()}</strong> persona.
                                   </p>
                                   <button 
                                    onClick={initChat}
                                    className="px-6 py-3 bg-dna-primary text-white rounded-xl font-bold hover:shadow-lg transition-all"
                                   >
                                       Initialize Agent
                                   </button>
                               </div>
                           ) : (
                               <>
                                   <div className="flex-1 flex flex-col min-w-0">
                                       {/* Chat Header with Debug Toggle */}
                                       <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Live Session</span>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setShowDebug(!showDebug)}
                                                    className={`px-2 py-1 text-xs rounded border transition-colors ${showDebug ? 'bg-dna-primary text-white border-dna-primary' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'}`}
                                                >
                                                    Debug Logs
                                                </button>
                                                <button onClick={() => setChatSession(null)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                                                    Reset
                                                </button>
                                            </div>
                                       </div>

                                       <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                                           {messages.map((m, i) => (
                                               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                   <div className={`max-w-[80%] p-3 rounded-xl text-sm ${m.role === 'user' ? 'bg-dna-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700'}`}>
                                                       {m.text}
                                                   </div>
                                               </div>
                                           ))}
                                           {isThinking && (
                                               <div className="flex justify-start">
                                                   <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex gap-1">
                                                       <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></span>
                                                       <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></span>
                                                       <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></span>
                                                   </div>
                                               </div>
                                           )}
                                           <div ref={messagesEndRef}></div>
                                       </div>
                                       
                                       <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                                           <input 
                                            className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border-none focus:ring-2 focus:ring-dna-primary outline-none"
                                            placeholder="Type a test message..."
                                            value={inputMsg}
                                            onChange={(e) => setInputMsg(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                           />
                                           <button onClick={handleSendMessage} disabled={isThinking} className="px-4 bg-dna-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                                               Send
                                           </button>
                                       </div>
                                   </div>

                                   {/* Debug Log Panel */}
                                   <AnimatePresence>
                                       {showDebug && (
                                           <motion.div 
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: 320, opacity: 1 }}
                                                exit={{ width: 0, opacity: 0 }}
                                                className="border-l border-gray-200 dark:border-gray-700 bg-gray-900 text-green-400 font-mono text-xs flex flex-col overflow-hidden"
                                           >
                                                <div className="p-2 border-b border-gray-800 bg-black/20 font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                                                    <span>Neural Log</span>
                                                    <span className="text-[10px] text-gray-600">{logs.length} events</span>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                                    {logs.map((log) => (
                                                        <div key={log.id} className="border-b border-gray-800/50 pb-2 last:border-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-gray-500 text-[10px]">{log.timestamp}</span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                                    log.type === 'system' ? 'bg-gray-700 text-gray-300' :
                                                                    log.type === 'user' ? 'bg-blue-900 text-blue-300' :
                                                                    log.type === 'agent' ? 'bg-green-900 text-green-300' :
                                                                    'bg-red-900 text-red-300'
                                                                }`}>
                                                                    {log.label}
                                                                </span>
                                                            </div>
                                                            <div className="break-words text-gray-300 leading-relaxed">
                                                                {log.message}
                                                            </div>
                                                            {log.meta && (
                                                                <div className="mt-1 text-[10px] text-gray-500">
                                                                    {log.meta}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div ref={logsEndRef} />
                                                </div>
                                           </motion.div>
                                       )}
                                   </AnimatePresence>
                               </>
                           )}
                      </motion.div>
                  )}

                  {/* TAB 3: DEPLOY */}
                  {activeTab === 'deploy' && (
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="h-full flex flex-col p-8 overflow-y-auto">
                          <h3 className="text-xl font-bold mb-4 font-display">Deploy {selectedDNA.name} Agent</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-6">
                              Copy this TypeScript code to deploy this agent in your own application using the Google GenAI SDK.
                          </p>

                          <div className="relative bg-gray-900 rounded-xl p-6 font-mono text-xs text-green-400 overflow-x-auto border border-gray-700 shadow-inner">
                              <pre>{`import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System Instruction for ${role.toUpperCase()}
const SYSTEM_INSTRUCTION = \`
${systemPrompt.replace(/`/g, '\\`')}
\`;

export const create${selectedDNA.name.replace(/\s+/g, '')}Agent = async () => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: ${guardrails.strictness === 'high' ? 0.3 : guardrails.strictness === 'low' ? 0.9 : 0.7},
    }
  });
  
  return chat;
};

// Usage
// const agent = await create${selectedDNA.name.replace(/\s+/g, '')}Agent();
// const response = await agent.sendMessage({ message: "Hello!" });
// console.log(response.text);
`}</pre>
                               <button 
                                onClick={() => navigator.clipboard.writeText("Code copied!")}
                                className="absolute top-4 right-4 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-xs border border-white/10"
                               >
                                   Copy Code
                               </button>
                          </div>
                          
                          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-4">
                              <div className="text-blue-500">
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <div>
                                  <h4 className="font-bold text-blue-800 dark:text-blue-300">Enterprise Deployment</h4>
                                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                      Need to deploy this as a hosted API endpoint or Slack/Discord bot? 
                                      <a href="#" className="underline ml-1">Upgrade to Agency Tier</a> to enable one-click cloud deployment.
                                  </p>
                              </div>
                          </div>
                      </motion.div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default AgentForgePage;
