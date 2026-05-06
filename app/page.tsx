'use client';

import React, { useState, useRef, useEffect } from 'react';
import { OfficeCanvas, GameState } from '@/components/OfficeCanvas';
import { ChatSidebar } from '@/components/ChatSidebar';
import { Character, CharacterState } from '@/lib/office/worker/api/Character';
import { Pathfinding } from '@/lib/office/engine/Pathfinding';
import { SpriteLoader } from '@/lib/office/engine/SpriteLoader';

const RAW_MAP = [
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1 ],
  [ 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1 ],
  [ 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1 ],
  [ 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1 ],
  [ 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1 ],
  [ 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1 ],
  [ 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1 ],
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]
];

const MAX_COLS = Math.max(...RAW_MAP.map(r => r.length));

function createGrid() {
  const grid = RAW_MAP.map(row => {
    const newRow = [...row];
    while(newRow.length < MAX_COLS) newRow.push(1);
    return newRow;
  });
  
  // Bake desks as unwalkable so agents don't randomly wander into them
  const defaultDesks = [
    { x: 9, y: 10 }, { x: 9, y: 13 }, { x: 11, y: 10 }, { x: 11, y: 13 },
    { x: 13, y: 10 }, { x: 13, y: 13 }, { x: 15, y: 10 }, { x: 15, y: 13 },
    { x: 17, y: 10 }, { x: 17, y: 13 }, { x: 19, y: 10 }, { x: 19, y: 13 },
  ];
  for (const desk of defaultDesks) {
    if (grid[desk.y] && grid[desk.y][desk.x] !== undefined) {
      grid[desk.y][desk.x] = 1;
    }
  }
  
  return grid;
}

export default function Page() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<string, any[]>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [showHireMenu, setShowHireMenu] = useState(false);
  const [characterList, setCharacterList] = useState<Character[]>([]);

  useEffect(() => {
    SpriteLoader.loadSheets().then(() => {
      setAssetsLoaded(true);
    });
  }, []);

  const gameStateRef = useRef<GameState>({
    characters: [],
    grid: createGrid(),
    selectedId: null,
    serverRoomPoint: { x: 3, y: 3 },
    meetingTableRoomPoint: { x: 10, y: 4 },
    desks: [
      { x: 9, y: 10 }, { x: 9, y: 13 }, { x: 11, y: 10 }, { x: 11, y: 13 },
      { x: 13, y: 10 }, { x: 13, y: 13 }, { x: 15, y: 10 }, { x: 15, y: 13 },
      { x: 17, y: 10 }, { x: 17, y: 13 }, { x: 19, y: 10 }, { x: 19, y: 13 },
    ]
  });

  // Initial characters
  useEffect(() => {
    const chars = [
      new Character("c1", "Alice", 9, 11, "#EF4444", 0),
      new Character("c2", "Bob", 11, 11, "#3B82F6", 1),
    ];
    gameStateRef.current.characters = chars;
    setCharacterList([...chars]);
  }, []);

  // Make desks walls in grid so they can't path through them, only step on them
  useEffect(() => {
    const freshGrid = createGrid();
    for (const d of gameStateRef.current.desks) {
      freshGrid[d.y][d.x] = 1; // Mark desk directly as 1 so it matches wall behavior
    }
    // Add meeting table collision (x: 10..14, y: 4..6 roughly)
    for (let my = 4; my <= 6; my++) {
      for (let mx = 10; mx <= 14; mx++) {
        if (freshGrid[my] && freshGrid[my][mx] !== undefined) {
           freshGrid[my][mx] = 1;
        }
      }
    }
    gameStateRef.current.grid = freshGrid;
  }, []);

  const handleHireWorker = (spriteIdx: number, name: string) => {
    const state = gameStateRef.current;
    
    // Always spawn new hires at the bottom-center entrance
    let spawn = { x: 11, y: 18 };

    const newId = `c${Date.now()}`;
    const newChar = new Character(newId, name, spawn.x, spawn.y, "#ffffff", spriteIdx);
    state.characters.push(newChar);
    setCharacterList([...state.characters]);
    setShowHireMenu(false);
    setChats(prev => ({...prev}));
  };

  const handleFireWorker = () => {
    if (!selectedAgentId) return;
    const state = gameStateRef.current;
    state.characters = state.characters.filter(c => c.id !== selectedAgentId);
    setCharacterList([...state.characters]);
    state.selectedId = null;
    setSelectedAgentId(null);
    setChats(prev => ({...prev}));
  };


  useEffect(() => {
    const handleFire = () => handleFireWorker();
    const handleGeneralTask = (e: any) => {
      const { task, agentId } = e.detail;
      assignTaskToAgent(agentId, task);
    };
    window.addEventListener('fireWorker', handleFire);
    window.addEventListener('assignGeneralTask', handleGeneralTask);
    return () => {
      window.removeEventListener('fireWorker', handleFire);
      window.removeEventListener('assignGeneralTask', handleGeneralTask);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgentId]);

  const assignTaskToAgent = async (agentId: string, task: string) => {
    setChats(prev => ({
      ...prev,
      [agentId]: [...(prev[agentId] || []), { role: 'user', content: task }]
    }));
    
    const agent = gameStateRef.current.characters.find(c => c.id === agentId);
    if (!agent) return null;

    setLoadingMap(prev => ({ ...prev, [agentId]: true }));
    
    // Find assigned desk mapping from gameStateRef proximity or find a new free one
    const occupiedDesks = new Set(
      gameStateRef.current.characters
        .filter(c => c.id !== agent.id)
        .map(c => `${Math.floor(c.x)},${Math.floor(c.y) - 1}`)
    );
    
    let assignedDesk = gameStateRef.current.desks.find(d => 
       Math.abs(d.x - agent.x) < 2 && Math.abs(d.y - agent.y) < 2
    );
    if (!assignedDesk) {
       assignedDesk = gameStateRef.current.desks.find(d => !occupiedDesks.has(`${d.x},${d.y}`));
    }
    
    const originalDesk = assignedDesk ? { x: assignedDesk.x, y: assignedDesk.y } : { x: Math.floor(agent.x), y: Math.floor(agent.y) };

    const runTask = async () => {
      // Correct worker rotation at desk
      agent.y = originalDesk.y + 1;
      agent.direction = 3; // face up
      agent.state = CharacterState.WORK;
      
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, agentName: agent.name })
        });
        const data = await res.json();
        const responseText = data.result || data.error;

        setChats(prev => ({
          ...prev,
          [agent.id]: [...(prev[agent.id] || []), { role: 'agent', content: responseText }]
        }));
        setLoadingMap(prev => ({ ...prev, [agent.id]: false }));
        
        agent.state = CharacterState.IDLE;
        
        return data;
      } catch (e: any) {
        setChats(prev => ({
          ...prev,
          [agent.id]: [...(prev[agent.id] || []), { role: 'agent', content: `Error: ${e.message}` }]
        }));
        setLoadingMap(prev => ({ ...prev, [agent.id]: false }));
        
        agent.state = CharacterState.IDLE;
        
        return { result: `Error: ${e.message}` };
      }
    };

    // Send the agent to their desk to work (stand in front of it, facing up)
    const targetDesk = { x: originalDesk.x, y: originalDesk.y + 1 };
    
    // Check if agent is already at the desk working spot
    return new Promise((resolve) => {
      if (Math.abs(agent.x - targetDesk.x) < 0.1 && Math.abs(agent.y - targetDesk.y) < 0.1) {
         runTask().then(resolve);
      } else {
         const p = Pathfinding.findPath(gameStateRef.current.grid, { x: Math.round(agent.x), y: Math.round(agent.y) }, targetDesk);
         if (p.length > 0) {
           agent.onReachDestination = () => { runTask().then(resolve); };
           agent.setPath(p);
         } else {
           agent.x = targetDesk.x;
           agent.y = targetDesk.y;
           runTask().then(resolve);
         }
      }
    });
  };

  const handleAssignTask = async (task: string) => {
    if (!selectedAgentId) return;
    assignTaskToAgent(selectedAgentId, task);
  };

  // Telegram polling logic
  useEffect(() => {
    let lastUpdateId = 0;
    let isPolling = true;
    let abortController = new AbortController();

    const pollTelegram = async () => {
      if (!isPolling) return;
      try {
        const res = await fetch('/api/telegram/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offset: lastUpdateId + 1 }),
          signal: abortController.signal
        });
        
        if (!res.ok) {
           const errText = await res.text();
           console.error("Failed to fetch Telegram updates:", errText);
           // Wait before retrying
           if (isPolling) {
             setTimeout(pollTelegram, 5000);
           }
           return;
        }
        
        const data = await res.json();
        
        if (data.ok && data.result && data.result.length > 0) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            if (update.message && update.message.text) {
              const text = update.message.text as string;
              
              // Find an idle agent to assign the task to
              const state = gameStateRef.current;
              const availableAgent = state.characters.find(c => c.state === CharacterState.IDLE) || state.characters[0];
              
              if (availableAgent) {
                assignTaskToAgent(availableAgent.id, `[Telegram] ${text}`).then((res: any) => {
                  if (res && res.result) {
                    fetch('/api/telegram/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ chat_id: update.message.chat.id, text: `[${availableAgent.name}]: ${res.result}` })
                    }).catch(err => console.error("Error sending TG msg:", err));
                  }
                });
              }
            }
          }
        }
      } catch (e: any) {
        if (e.name === 'AbortError') {
          return;
        }
        console.error("Telegram poll error", e);
      }
      
      if (isPolling) {
        setTimeout(pollTelegram, 5000); // Polling interval
      }
    };
    
    pollTelegram();
    return () => { 
        isPolling = false; 
        abortController.abort();
    };
  }, []);

  const selectedAgent = gameStateRef.current.characters.find(c => c.id === selectedAgentId) || null;

  return (
    <div className="fixed inset-0 bg-[#0c0c0e] text-[#e0e0e0] font-mono flex flex-col overflow-hidden">
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#141416] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-bold tracking-tighter text-lg">AUWORKER <span className="text-white/40 text-xs font-normal">v0.8.2-BETA</span></span>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating HUD Controls */}
        <div className="absolute top-4 left-4 p-4 bg-black/80 border border-white/10 w-64 backdrop-blur-md z-50 font-mono text-[#e0e0e0] pointer-events-auto">
          <h3 className="text-[10px] uppercase text-white/40 mb-3 tracking-widest text-blue-400 font-bold">AuWorker Control</h3>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between"><span>Active Tasks</span> <span className="text-blue-400 font-bold">{Object.keys(loadingMap).filter(k => loadingMap[k]).length}</span></div>
            <div className="flex justify-between"><span>Worker Count</span> <span className="text-blue-400 font-bold">{characterList.length}</span></div>
            <div className="mt-2 text-[10px] space-y-1">
              {characterList.map(c => (
                <div key={c.id} className={`flex items-center gap-1 ${c.id === selectedAgentId ? 'text-blue-400' : 'text-white/40'}`}>
                  <span>•</span>
                  <span>{c.name}</span>
                  <span className="ml-auto text-[8px] opacity-50">{c.state}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <input 
                type="text" 
                placeholder="Give general task..."
                className="w-full bg-black/50 border border-white/10 px-2 py-1 text-[10px] outline-none focus:border-blue-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const task = e.currentTarget.value.trim();
                    e.currentTarget.value = '';
                    const availableAgent = characterList.find(c => c.state === CharacterState.IDLE) || characterList[0];
                    if (availableAgent) {
                      // Trigger task assignment globally (need to expose a function or use event, we can just use a generic event or direct state manipulation if within scope)
                      window.dispatchEvent(new CustomEvent('assignGeneralTask', { detail: { task, agentId: availableAgent.id } }));
                    }
                  }
                }}
              />
              <button 
                onClick={() => setShowHireMenu(true)}
                className="w-full py-1 border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 text-[10px] uppercase transition-colors"
              >
                Hire New Worker
              </button>
            </div>
            <div className="text-white/30 text-[9px] mt-2 leading-tight">
              • Click agent to assign task<br/>
              • Click & drag to pan<br/>
              • Scroll to zoom
            </div>
          </div>
        </div>

        <OfficeCanvas 
          gameStateData={gameStateRef.current} 
          onSelectAgent={(id) => {
            gameStateRef.current.selectedId = id;
            setSelectedAgentId(id);
          }} 
        />
        <ChatSidebar 
          agent={selectedAgent}
          onClose={() => {
            gameStateRef.current.selectedId = null;
            setSelectedAgentId(null);
          }}
          onAssignTask={handleAssignTask}
          messages={selectedAgentId ? (chats[selectedAgentId] || []) : []}
          isLoading={selectedAgentId ? !!loadingMap[selectedAgentId] : false}
        />
        
        {/* Hire Menu Overlay */}
        {showHireMenu && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center pointer-events-auto">
            <div className="w-[400px] bg-[#141416] border border-white/10 shadow-2xl p-6 font-mono text-[#e0e0e0]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-blue-400">Recruit New Worker</h2>
                <button onClick={() => setShowHireMenu(false)} className="text-white/40 hover:text-white">✕</button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
                  return (
                    <button 
                      key={idx}
                      onClick={() => handleHireWorker(idx, names[idx])}
                      className="border border-white/5 hover:border-blue-500/50 bg-black/40 hover:bg-blue-500/10 p-4 transition flex flex-col items-center gap-2"
                    >
                      <div className="w-12 h-12 bg-white/5 rounded-full overflow-hidden shrink-0">
                      <div 
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(/char_${idx}.png)`,
                          backgroundPosition: '16.66% 0%',
                          backgroundSize: '700% 300%',
                          backgroundRepeat: 'no-repeat',
                          imageRendering: 'pixelated'
                        }} 
                      />
                      </div>
                      <span className="text-[10px] text-white/50">{names[idx]}</span>
                    </button>
                  )
                })}
              </div>
              <div className="text-[9px] text-white/30 italic text-center">Click a profile to hire immediately to an empty desk.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
