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
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onAssignTask(input.trim());
    setInput('');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: isMinimized ? 340 : 380, opacity: 0 }}
        animate={{ 
          x: isMinimized ? 340 : 0, 
          opacity: 1,
          width: isMinimized ? 380 : 380 
        }}
        transition={{ type: 'tween', duration: 0.12, ease: 'easeOut' }}
        exit={{ x: 380, opacity: 0 }}
        className="fixed right-0 top-0 h-full border-l border-white/10 bg-[#0c0c0e] flex flex-row font-mono text-[#e0e0e0] z-[100] shadow-2xl transition-all"
      >
        {/* Toggle Button Column */}
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className="w-10 bg-[#141416] hover:bg-[#1a1a1c] border-r border-white/5 flex flex-col items-center justify-center gap-4 group shrink-0"
        >
          <div className="text-white/20 group-hover:text-white/60 text-xs font-bold [writing-mode:vertical-lr] rotate-180 tracking-[0.3em] uppercase">
            {isMinimized ? 'Expand Link' : 'Collapse Link'}
          </div>
          <div className="text-blue-500 text-lg">{isMinimized ? '«' : '»'}</div>
        </button>

        <div className="w-[340px] flex flex-col h-full overflow-hidden">
          
          {!agent ? (
             <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-20">
                <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center mb-4 text-xl">?</div>
                <div className="text-[10px] uppercase tracking-[0.2em] leading-relaxed">
                  No active worker signal detected.<br/>Select a unit to establish link.
                </div>
             </div>
          ) : (
            <>
              {/* Section 1: Profile */}
              <div className="bg-[#141416] border-b border-white/10 flex flex-col shrink-0">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-[10px] uppercase text-white/40 tracking-widest font-bold">Worker Unit Profile</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white flex items-center gap-1 text-[10px] uppercase">
                <span>Deselect</span>
                <span className="text-sm">✕</span>
              </button>
            </div>
            
            <div className="p-4 flex items-center gap-4">
               <div className="w-20 h-20 bg-black border border-white/10 shrink-0 overflow-hidden relative shadow-lg">
                  <div 
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(/char_${agent.spriteIndex}.png)`,
                      backgroundPosition: '16.66% 0%',
                      backgroundSize: '700% 300%',
                      backgroundRepeat: 'no-repeat',
                      imageRendering: 'pixelated'
                    }} 
                  />
               </div>
               
               <div className="flex-1">
                 <div className="text-lg font-bold uppercase tracking-widest leading-tight">{agent.name}</div>
                 <div className="flex items-center gap-2 mt-1 mb-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${agent.state === CharacterState.WORK ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                   <span className="text-[9px] uppercase tracking-tighter text-white/60">{agent.state}</span>
                 </div>
                 
                 <div className="flex gap-2">
                    <div className="text-[8px] bg-white/5 px-1.5 py-0.5 border border-white/5">SPD: 4.0</div>
                    <div className="text-[8px] bg-white/5 px-1.5 py-0.5 border border-white/5">TSK: {messages.length / 2}</div>
                 </div>
               </div>
            </div>
          </div>

          {/* Section 2: Chat / Console */}
          <div className="flex-1 flex flex-col min-h-0 bg-black/40">
            <div className="p-3 bg-black/60 border-b border-white/10 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-blue-500/50 rounded-full"></div>
               <span className="text-[9px] uppercase text-white/40 font-bold tracking-widest">Neural Link Intercom</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="m-auto text-center py-10 opacity-20">
                  <div className="text-[9px] uppercase tracking-[0.2em] mb-2 leading-relaxed">
                    Standby for instructions...
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className="text-xs">
                    {m.role === 'user' ? (
                      <div className="flex flex-col items-end">
                        <div className="p-2 bg-blue-500/10 border-r-2 border-blue-500 text-blue-100 font-sans leading-relaxed text-[11px] mb-1">{m.content}</div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start">
                        <div className="p-2 bg-white/5 border border-white/10 text-white/80 font-sans leading-relaxed text-[11px] mb-1">{m.content}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="p-2 bg-yellow-500/5 border border-yellow-500/20 text-yellow-500/80 text-[10px] font-bold animate-pulse uppercase tracking-widest italic">
                  &gt; Computing trajectory...
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 bg-[#141416] border-t border-white/10">
              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full bg-black border border-white/10 p-2 text-[11px] h-20 focus:outline-none focus:border-blue-500/50 text-[#e0e0e0] font-mono resize-none"
                  placeholder="Input task parameters..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isLoading || agent.state === CharacterState.WORK}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || agent.state === CharacterState.WORK}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold tracking-widest uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  📡 TRANSMIT COMMAND
                </button>
              </div>
            </form>

            <button 
              onClick={() => {
                const event = new CustomEvent('fireWorker');
                window.dispatchEvent(event);
              }}
              className="mt-2 p-2 text-[9px] text-red-500/40 hover:text-red-500 uppercase tracking-widest text-center transition-colors border-t border-white/5"
            >
              Terminate Unit Connection
            </button>
          </div>
          </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
