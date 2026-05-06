'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character, CharacterState } from '@/lib/office/worker/api/Character';

interface Message {
  role: 'user' | 'agent';
  content: string;
}

interface ChatSidebarProps {
  agent: Character | null;
  onClose: () => void;
  onAssignTask: (task: string) => void;
  messages: Message[];
  isLoading: boolean;
}

export function ChatSidebar({ agent, onClose, onAssignTask, messages, isLoading }: ChatSidebarProps) {
  const [input, setInput] = useState('');

  if (!agent) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onAssignTask(input.trim());
    setInput('');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 font-mono text-[#e0e0e0]"
      >
        <div className="w-[800px] h-[500px] flex gap-4">
          
          {/* Card 1: Biodata */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-[300px] bg-[#141416] border border-white/10 shadow-2xl flex flex-col relative"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-[10px] uppercase text-white/40 tracking-widest">Worker Profile</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white lg:hidden">✕</button>
            </div>
            
            <div className="p-6 flex flex-col flex-1 items-center gap-4">
               <div className="w-32 h-32 bg-black border border-white/10 shrink-0 overflow-hidden relative shadow-lg">
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(/char_${agent.spriteIndex}.png)`,
                      backgroundPosition: '0% 0%',
                      backgroundSize: '700% 300%',
                      imageRendering: 'pixelated'
                    }} 
                  />
               </div>
               
               <div className="text-center w-full">
                 <div className="text-2xl font-bold uppercase tracking-widest mb-1">{agent.name}</div>
                 <div className="flex items-center justify-center gap-2 mb-4">
                   <span className={`text-[10px] uppercase px-2 py-0.5 border ${agent.state === CharacterState.WORK ? 'text-green-400 border-green-400/20 bg-green-400/10' : 'text-blue-400 border-blue-400/20 bg-blue-400/10'}`}>
                     • {agent.state}
                   </span>
                 </div>
                 
                 <div className="space-y-2 text-[10px] text-white/40 border border-white/5 p-4 bg-black/20 text-left">
                    <div className="flex justify-between border-b border-white/5 pb-1"><span>Model:</span> <span className="text-white/80">Alpha-{(agent.spriteIndex * 7 + 13).toString(16).toUpperCase()}</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span>Base Speed:</span> <span className="text-white/80">4 T/s</span></div>
                    <div className="flex justify-between border-b border-white/5 pb-1"><span>Uptime:</span> <span className="text-white/80">{Math.floor((agent.spriteIndex * 42.5 + agent.name.length * 11) % 200 + 40)}h</span></div>
                    <div className="flex justify-between"><span>Completed Tasks:</span> <span className="text-green-400">{messages.length / 2}</span></div>
                 </div>
               </div>

               <div className="mt-auto w-full">
                 <button 
                    onClick={() => {
                      const event = new CustomEvent('fireWorker');
                      window.dispatchEvent(event);
                    }}
                    className="w-full text-[10px] uppercase font-bold tracking-widest px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all"
                  >
                    Fire Worker
                 </button>
               </div>
            </div>
          </motion.div>

          {/* Card 2: Chat */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex-1 bg-[#141416] border border-white/10 shadow-2xl flex flex-col relative"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-[10px] uppercase text-white/40 tracking-widest">Intercom / Direct Line</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white">✕ Close UI</button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-black/20">
              {messages.length === 0 ? (
                <div className="m-auto text-center space-y-4">
                  <div className="w-16 h-16 border rounded-full border-blue-500/30 flex items-center justify-center mx-auto text-blue-500/50">
                    ✉
                  </div>
                  <div className="text-white/30 text-xs italic tracking-wide uppercase">
                    Connection established.<br/>Waiting for deployment instructions.
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className="text-xs space-y-1">
                    {m.role === 'user' ? (
                      <div className="flex flex-col items-end">
                        <div className="text-white/30 italic uppercase text-[9px] mb-1">Director</div>
                        <div className="p-3 max-w-[80%] bg-blue-500/10 border-r-2 border-blue-500 text-blue-100 font-sans shadow-lg">{m.content}</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start">
                        <div className="text-white/30 italic uppercase text-[9px] mb-1">{agent.name}</div>
                        <div className="p-3 max-w-[80%] bg-white/5 border border-white/10 text-[#e0e0e0] font-sans shadow-lg">{m.content}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex flex-col items-start">
                  <div className="text-white/30 italic uppercase text-[9px] mb-1">{agent.name}</div>
                  <div className="p-3 bg-white/5 italic border border-yellow-500/30 text-yellow-500 text-xs font-bold animate-pulse shadow-lg">PROCESSING SIGNAL...</div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-[#141416]">
              <div className="flex gap-3">
                <input
                  type="text"
                  className="flex-1 bg-black border border-white/20 p-3 text-sm focus:outline-none focus:border-blue-500 text-[#e0e0e0] font-mono shadow-inner shadow-black"
                  placeholder="Type instruction here..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isLoading || agent.state === CharacterState.WORK}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || agent.state === CharacterState.WORK}
                  className="px-6 py-3 border border-blue-500/50 hover:bg-blue-500/20 text-blue-400 text-[11px] font-bold tracking-widest uppercase transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  DELEGATE
                </button>
              </div>
            </form>
          </motion.div>
          
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
