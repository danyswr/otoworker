'use client';

import React, { useEffect, useRef } from 'react';
import { GameLoop } from '@/lib/office/engine/GameLoop';
import { Renderer } from '@/lib/office/engine/Renderer';
import { Character, CharacterState } from '@/lib/office/worker/api/Character';
import { Point, Pathfinding } from '@/lib/office/engine/Pathfinding';
import { SpriteLoader } from '@/lib/office/engine/SpriteLoader';

export interface GameState {
  characters: Character[];
  grid: number[][]; // 0: empty, 1: wall/desk
  selectedId: string | null;
  hoverTrackingId?: string | null;
  serverRoomPoint: Point;
  desks: Point[];
  meetingTableRoomPoint: Point;
}

interface OfficeCanvasProps {
  gameStateData: GameState;
  onSelectAgent: (id: string | null) => void;
  onCabinetClick?: () => void;
}

export function OfficeCanvas({ gameStateData, onSelectAgent, onCabinetClick }: OfficeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<{ loop: GameLoop; renderer: Renderer } | null>(null);
  
  // Track camera state locally for panning/zooming without triggering React re-renders for every frame
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const isDragging = useRef(false);
  const isDraggingCharacter = useRef<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const hoverTrackingIdRef = useRef<string | null>(null);

  const TILE_SIZE = 32;

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new Renderer(ctx, canvas.width, canvas.height);
    // Initial camera position centered loosely around map
    const mapW = gameStateData.grid[0].length * TILE_SIZE;
    const mapH = gameStateData.grid.length * TILE_SIZE;
    cameraRef.current.x = mapW / 2;
    cameraRef.current.y = mapH / 2;
    renderer.camera = cameraRef.current;

    const update = (dt: number) => {
      // Background idle movement (wander)
      gameStateData.characters.forEach(char => {
        char.update(dt);
        
        // Environment Awareness: Detect nearby points of interest
        char.nearbyPOI = null;
        const distToServer = Math.sqrt(Math.pow(char.x - gameStateData.serverRoomPoint.x, 2) + Math.pow(char.y - gameStateData.serverRoomPoint.y, 2));
        if (distToServer < 3) {
            char.nearbyPOI = "server";
        } else {
            const nearDesk = gameStateData.desks.find(d => Math.sqrt(Math.pow(char.x - d.x, 2) + Math.pow(char.y - d.y, 2)) < 1.5);
            if (nearDesk) {
                char.nearbyPOI = "desk";
            } else {
                const distToMeeting = Math.sqrt(Math.pow(char.x - gameStateData.meetingTableRoomPoint.x, 2) + Math.pow(char.y - gameStateData.meetingTableRoomPoint.y, 2));
                if (distToMeeting < 4) {
                    char.nearbyPOI = "meeting";
                }
            }
        }

        char.chatMessage = false; // reset chat by default
        if (char.chatTimer > -10) {
          char.chatTimer -= dt;
        }
        
        if (char.state === CharacterState.IDLE && gameStateData.selectedId !== char.id && isDraggingCharacter.current !== char.id) {
          // Check proximity to other IDLE characters for chat
          const nearby = gameStateData.characters.find(c => c !== char && c.state === CharacterState.IDLE && Math.abs(c.x - char.x) < 2 && Math.abs(c.y - char.y) < 2);
          
          if (nearby && char.chatTimer <= 0 && nearby.chatTimer <= 0 && Math.random() < 0.1) {
            // Start chatting
            char.chatTimer = 5; // chat for 5 seconds
            nearby.chatTimer = 5;
          }

          if (nearby && char.chatTimer > 0) {
            // Face each other
            if (Math.abs(nearby.x - char.x) > Math.abs(nearby.y - char.y)) {
               char.direction = nearby.x > char.x ? 2 : 1;
            } else {
               char.direction = nearby.y > char.y ? 0 : 3;
            }
            
            // Randomly flash chat bubble if chatting
            if (Date.now() % 4000 < 2000) {
              char.chatMessage = true;
            }
          } else if (Math.random() < 0.01 && char.chatTimer <= 0) {
            // Wander
            const rx = Math.floor(Math.random() * gameStateData.grid[0].length);
            const ry = Math.floor(Math.random() * gameStateData.grid.length);
            
            // Check if spot is walkable AND not a desk (we only want them to sit at desks when assigned)
            const isDesk = gameStateData.desks.some(d => d.x === rx && d.y === ry);
            
            if (gameStateData.grid[ry]?.[rx] === 0 && !isDesk) {
              const p = Pathfinding.findPath(gameStateData.grid, { x: Math.round(char.x), y: Math.round(char.y) }, { x: rx, y: ry });
              if (p.length > 0) {
                 char.setPath(p);
                 char.chatTimer = -10; // reset cooldown so they don't instachat on next stop
              }
            }
          }
        }
      });
    };

    const draw = () => {
      const rows = gameStateData.grid.length;
      const cols = gameStateData.grid[0].length;
      renderer.clear();
      renderer.camera = cameraRef.current;

      renderer.begin();

      // Draw Floor/Grid
      if (SpriteLoader.officeImage) {
        renderer.drawImage(SpriteLoader.officeImage, 0, 0, SpriteLoader.officeImage.width, SpriteLoader.officeImage.height, 0, 0, mapW, mapH);
      }

      // Collect renderables for z-depth sorting
      const renderables: { y: number; draw: () => void }[] = [];

      for (let y = 0; y < rows; y++) {
        const py = y * TILE_SIZE;
        
        // Push full row slice of walls if available
        if (SpriteLoader.wallImage && SpriteLoader.wallImage.width > 100) {
          renderables.push({
            y: y + 1, // Sort by the bottom of the wall row
            draw: () => {
              const scaleX = SpriteLoader.wallImage!.width / mapW;
              const scaleY = SpriteLoader.wallImage!.height / mapH;
              
              const drawY = py;
              const drawH = Math.min(TILE_SIZE, mapH - drawY);
              if (drawH <= 0) return;
              
              renderer.drawImage(
                SpriteLoader.wallImage!,
                0, Math.max(0, drawY * scaleY), SpriteLoader.wallImage!.width, drawH * scaleY,
                0, drawY, mapW, drawH
              );
            }
          });
        }

        for (let x = 0; x < cols; x++) {
          const tile = gameStateData.grid[y][x];
          const px = x * TILE_SIZE;

          const outlineAlpha = SpriteLoader.officeImage ? 0 : 0.2;

          if (!SpriteLoader.officeImage && tile !== 1) {
            // Floor outline
            renderer.drawOutline(px, py, TILE_SIZE, TILE_SIZE, `rgba(255, 255, 255, ${outlineAlpha})`, 1);
          }

          if (tile === 1 && !SpriteLoader.wallImage) {
            renderables.push({
              y: y + 1,
              draw: () => {
                   renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "rgba(255, 255, 255, 0.05)");
                   renderer.drawOutline(px, py, TILE_SIZE, TILE_SIZE, "rgba(255, 255, 255, 0.2)", 1);
              }
            });
          }
        }
      }

      // Draw Server Room Label
      if (!SpriteLoader.officeImage) {
         renderer.drawText("SERVER ROOM", (gameStateData.serverRoomPoint.x + 1.5) * TILE_SIZE, (gameStateData.serverRoomPoint.y - 0.5) * TILE_SIZE, "rgba(255, 255, 255, 0.1)", "bold 20px monospace");
      }

      // Iron Cabinet
      const icImg = SpriteLoader.ironCabinetImage;
      const icX = -0.05; 
      const icY = 0.55;
      
      const drawW = TILE_SIZE * 3.15;
      const drawH = TILE_SIZE * 3.15;

      const mx = lastMousePos.current.x - (canvasRef.current?.width || 0) / 2;
      const my = lastMousePos.current.y - (canvasRef.current?.height || 0) / 2;
      const wx = mx / cameraRef.current.zoom + cameraRef.current.x;
      const wy = my / cameraRef.current.zoom + cameraRef.current.y;
      
      const isCabinetHovered = wx >= icX * TILE_SIZE && wx <= icX * TILE_SIZE + drawW &&
                               wy >= icY * TILE_SIZE && wy <= icY * TILE_SIZE + drawH;

      if (icImg) {
        renderables.push({
          y: Math.max(icY + 3.8, 5.0),
          draw: () => {
             if (isCabinetHovered) {
               renderer.ctx.save();
               renderer.ctx.filter = "brightness(1.25)";
               renderer.drawImage(icImg, 0, 0, icImg.width, icImg.height, icX * TILE_SIZE, icY * TILE_SIZE, drawW, drawH);
               renderer.ctx.restore();
             } else {
               renderer.drawImage(icImg, 0, 0, icImg.width, icImg.height, icX * TILE_SIZE, icY * TILE_SIZE, drawW, drawH);
             }
          }
        });
      }

      // Desks
      for (const desk of gameStateData.desks) {
        const deskImg = SpriteLoader.deskImage;
        renderables.push({
          y: desk.y + 1.2, // Increased sort weight so it nimpa (overlaps) character at y-1 and y
          draw: () => {
            if (deskImg) {
              const drawW = TILE_SIZE * 1.4;
              const drawH = TILE_SIZE * 1.4;
              renderer.drawImage(deskImg, 0, 0, deskImg.width, deskImg.height, desk.x * TILE_SIZE - TILE_SIZE * 0.2, desk.y * TILE_SIZE - TILE_SIZE * 0.4, drawW, drawH);
            } else {
              renderer.drawRect(desk.x * TILE_SIZE, desk.y * TILE_SIZE, TILE_SIZE, TILE_SIZE, "brown");
            }
          }
        });
      }

      // Meeting Table
      const mtImg = SpriteLoader.meetingTableImage;
      if (mtImg) {
        renderables.push({
          y: gameStateData.meetingTableRoomPoint.y + 1.8,
          draw: () => {
            const mtX = (gameStateData.meetingTableRoomPoint.x - 0.5) * TILE_SIZE;
            const mtY = (gameStateData.meetingTableRoomPoint.y - 0.5) * TILE_SIZE;
            renderer.drawImage(mtImg, 0, 0, mtImg.width, mtImg.height, mtX, mtY, TILE_SIZE * 6, TILE_SIZE * 3.5);
          }
        });
      }

      // Characters
      gameStateData.characters.forEach(char => {
        const isDragged = char.id === isDraggingCharacter.current;
        renderables.push({
          y: isDragged ? Infinity : char.y + 0.9, // Sort dragged character on top of everything
          draw: () => {
            const isHoveredOrSelected = char.id === gameStateData.selectedId || char.id === hoverTrackingIdRef.current;
            char.draw(renderer, TILE_SIZE, isHoveredOrSelected, isDragged);
            
            // Draw chat bubble if character has active message or is near someone talking
            if (char.chatTimer > 0) {
              const cx = char.x * TILE_SIZE + TILE_SIZE/2;
              const cy = char.y * TILE_SIZE - TILE_SIZE - 20;
              renderer.ctx.fillStyle = "white";
              renderer.ctx.beginPath();
              renderer.ctx.roundRect(cx - 20, cy - 15, 40, 20, 4);
              renderer.ctx.fill();
              
              renderer.ctx.beginPath();
              renderer.ctx.moveTo(cx - 5, cy + 5);
              renderer.ctx.lineTo(cx + 5, cy + 5);
              renderer.ctx.lineTo(cx, cy + 10);
              renderer.ctx.fill();

              // dot animation based on time
              const t = Date.now();
              let dots = ".";
              if (t % 1500 > 1000) dots = "...";
              else if (t % 1500 > 500) dots = "..";

              renderer.ctx.fillStyle = "black";
              renderer.ctx.font = "bold 14px sans-serif";
              renderer.ctx.textAlign = "center";
              renderer.ctx.fillText(dots, cx, cy - 2);
            }
          }
        });
      });

      // Sort and render
      renderables.sort((a, b) => a.y - b.y).forEach(r => r.draw());

      renderer.end();
    };

    const loop = new GameLoop(update, draw);
    loop.start();
    engineRef.current = { loop, renderer };

    return () => {
      loop.stop();
    };
  }, [gameStateData]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        if (!containerRef.current || !canvasRef.current || !engineRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        
        // Only update if dimensions actually changed to avoid redundant work
        if (canvasRef.current.width !== w || canvasRef.current.height !== h) {
          canvasRef.current.width = w;
          canvasRef.current.height = h;
          engineRef.current.renderer.resize(w, h);
        }
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Make sure selection change is synchronized with ref/loop if changed externally
  // But we mostly mutate gameStateData by reference, so no extra sync needed.

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // Detect click on character
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    
    // Reverse the renderer transformations
    // screen = (world - camera) * zoom + center
    // world = (screen - center) / zoom + camera
    const wx = (mx - w / 2) / cameraRef.current.zoom + cameraRef.current.x;
    const wy = (my - h / 2) / cameraRef.current.zoom + cameraRef.current.y;

    // Check Cabinet Click
    const icX = -0.05; 
    const icY = 0.55; // Match rendering
    const drawW = TILE_SIZE * 3.15;
    const drawH = TILE_SIZE * 3.15;
    const isCabinetClicked = wx >= icX * TILE_SIZE && wx <= icX * TILE_SIZE + drawW &&
                             wy >= icY * TILE_SIZE && wy <= icY * TILE_SIZE + drawH;
                             
    if (isCabinetClicked && onCabinetClick) {
      onCabinetClick();
      return;
    }

    let clickedAgentId = null;
    for (const char of gameStateData.characters) {
      const cx = char.x * TILE_SIZE;
      const cy = char.y * TILE_SIZE;
      // Adjusted bounds to be tighter to character head/body
      if (wx >= cx && wx <= cx + TILE_SIZE && wy >= cy - TILE_SIZE && wy <= cy + TILE_SIZE) {
        clickedAgentId = char.id;
        break;
      }
    }

    isDraggingCharacter.current = clickedAgentId;
    
    // Only pan if not dragging a character
    if (!clickedAgentId) {
      isDragging.current = true;
    }
    
    onSelectAgent(clickedAgentId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    
    const wx = (mx - w / 2) / cameraRef.current.zoom + cameraRef.current.x;
    const wy = (my - h / 2) / cameraRef.current.zoom + cameraRef.current.y;

    let hoveredId = null;
    for (const char of gameStateData.characters) {
      const cx = char.x * TILE_SIZE;
      const cy = char.y * TILE_SIZE;
      if (wx >= cx && wx <= cx + TILE_SIZE && wy >= cy - TILE_SIZE/2 && wy <= cy + TILE_SIZE) {
        hoveredId = char.id;
        break;
      }
    }
    
    hoverTrackingIdRef.current = hoveredId;

    if (isDraggingCharacter.current) {
        const char = gameStateData.characters.find(c => c.id === isDraggingCharacter.current);
        if (char) {
           char.x = (wx - TILE_SIZE/2) / TILE_SIZE; // centering on cursor
           char.y = (wy - TILE_SIZE/2) / TILE_SIZE;
           char.state = CharacterState.IDLE;
           char.setPath([]); 
        }
        return;
    }

    const icX = -0.05; 
    const icY = 0.55;
    const drawW = TILE_SIZE * 3.15;
    const drawH = TILE_SIZE * 3.15;
    const isCabinetHovered = wx >= icX * TILE_SIZE && wx <= icX * TILE_SIZE + drawW &&
                             wy >= icY * TILE_SIZE && wy <= icY * TILE_SIZE + drawH;
                             
    if (containerRef.current) {
      if (hoveredId || isCabinetHovered) {
        containerRef.current.style.cursor = 'pointer';
      } else {
        containerRef.current.style.cursor = 'grab';
      }
    }

    if (!isDragging.current) return;
    
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    // Pan camera (inverse direction of mouse drag)
    cameraRef.current.x -= dx / cameraRef.current.zoom;
    cameraRef.current.y -= dy / cameraRef.current.zoom;

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    isDragging.current = false;
    
    if (isDraggingCharacter.current) {
      const char = gameStateData.characters.find(c => c.id === isDraggingCharacter.current);
      if (char) {
        // Snap to grid
        let snX = Math.round(char.x);
        let snY = Math.round(char.y);
        
        // Ensure within bounds and not in wall
        const grid = gameStateData.grid;
        if (grid && grid.length > 0) {
          snY = Math.max(0, Math.min(snY, grid.length - 1));
          snX = Math.max(0, Math.min(snX, grid[0].length - 1));
          
          // simple nearest search if placed on a wall
          if (grid[snY][snX] !== 0) {
            let found = false;
            for (let r = 1; r < 5 && !found; r++) {
              for (let dy = -r; dy <= r && !found; dy++) {
                for (let dx = -r; dx <= r && !found; dx++) {
                  const ny = snY + dy;
                  const nx = snX + dx;
                  if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length && grid[ny][nx] === 0) {
                    snX = nx;
                    snY = ny;
                    found = true;
                  }
                }
              }
            }
          }
        }
        char.x = snX;
        char.y = snY;
      }
    }

    isDraggingCharacter.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.001;
    let newZoom = cameraRef.current.zoom - e.deltaY * zoomSensitivity;
    newZoom = Math.max(0.5, Math.min(newZoom, 3)); // Clamp zoom between 0.5x and 3x
    cameraRef.current.zoom = newZoom;
  };

  return (
    <div 
      ref={containerRef} 
      className="flex-1 relative bg-gradient-to-br from-background via-surface to-background flex items-center justify-center overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      style={{ touchAction: 'none' }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.04) 1px, transparent 0)", backgroundSize: "32px 32px" }}></div>
      <canvas ref={canvasRef} className="block w-full h-full relative z-10" />
    </div>
  );
}
