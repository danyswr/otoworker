import { Renderer } from '../../engine/Renderer';
import { Point } from '../../engine/Pathfinding';
import { SpriteLoader } from '../../engine/SpriteLoader';

// Finite State Machine statuses
export enum CharacterState {
  IDLE = "IDLE",
  WALK = "WALK",
  WORK = "WORK",
  ERROR = "ERROR"
}

export class Character {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  spriteIndex: number;
  state: CharacterState = CharacterState.IDLE;
  
  private path: Point[] = [];
  private moveSpeed: number = 6; // Tiles per second
  public onReachDestination?: () => void;
  
  // Animation state
  public direction: number = 0; // 0=down, 1=left, 2=right, 3=up
  private frameTime: number = 0;
  private animFrame: number = 1; // 0, 1, 2 frames for walk
  public chatMessage: boolean = false;
  public chatTimer: number = 0;
  
  constructor(id: string, name: string, x: number, y: number, color: string, spriteIndex: number = 0) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.color = color;
    this.spriteIndex = spriteIndex;
  }

  setPath(newPath: Point[]) {
    this.path = newPath;
    if (this.path.length > 0) {
      this.state = CharacterState.WALK;
    }
  }

  update(dt: number) {
    if (this.state === CharacterState.WALK || this.state === CharacterState.WORK) {
      this.frameTime += dt;
      if (this.frameTime > 0.1) {
        this.frameTime = 0;
        this.animFrame = (this.animFrame + 1) % 12;
      }
    }

    if (this.state === CharacterState.WALK) {
      if (this.path.length > 0) {
        let target = this.path[0];
        
        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        const moveDist = this.moveSpeed * dt;

        if (dist <= moveDist) {
          // Reached the next path node
          this.x = target.x;
          this.y = target.y;
          this.path.shift();
          
          if (this.path.length === 0) {
            this.state = CharacterState.IDLE;
            this.animFrame = 1; // reset to standing
            if (this.onReachDestination) {
              this.onReachDestination();
              this.onReachDestination = undefined; // clear it
            }
          }
        } else {
          // Normalize and move directly towards target (which is guaranteed orthogonal if A* produces orthogonal)
          this.x += (dx / dist) * moveDist;
          this.y += (dy / dist) * moveDist;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          this.direction = dx > 0 ? 2 : 1; // Right : Left
        } else if (dy !== 0) {
          this.direction = dy > 0 ? 0 : 3; // Down : Up
        }
      } else {
        this.state = CharacterState.IDLE;
        this.animFrame = 1;
        this.direction = 3; // Face UP when idle
      }
    }
  }

  draw(renderer: Renderer, tileSize: number, isSelected: boolean, isDragged: boolean = false) {
    // Top-left draw offset
    const px = this.x * tileSize;
    const py = this.y * tileSize; // Removed -0.2 offset to sit exactly on the tile foot

    const charSize = tileSize;

    if (SpriteLoader.characters[this.spriteIndex]) {
      const img = SpriteLoader.characters[this.spriteIndex]!;
      // 7 columns, 3 rows layout
      const fw = img.width / 7;
      const fh = img.height / 3;
      
      let col = 1; // Default to IDLE
      let row = this.direction === 3 ? 1 : this.direction; // 0=down, 1=up, 2=right
      
      // If Left, use row 2 and flip horizontally
      let flip = this.direction === 1;
      if (this.direction === 1) row = 2; // Left uses Right's row but flipped

      if (this.state === CharacterState.WALK) {
        const animArr = [0, 1, 2, 1];
        col = animArr[this.animFrame % 4];
      } else if (this.state === CharacterState.WORK) {
        if (row === 0) {
          // Down: reading paper (cols 5, 6)
          col = 5 + (this.animFrame % 2);
        } else if (row === 1) {
          // Up: just stand for now
          col = 1;
        } else {
          // Right/Left (side): working tools (cols 4, 5, 6)
          col = 4 + (this.animFrame % 3);
        }
      }

      const sx = col * fw;
      const sy = row * fh;

      // Make character slightly taller than a tile and overlap
      let drawWidth = charSize * 0.9; // Adjusted size
      let drawHeight = drawWidth * (fh / fw);
      
      // The visual foot of the character should align with the bottom of the current tile.
      let dx = px - (drawWidth - charSize)/2;
      let dy = py - (drawHeight - charSize) - charSize * 0.2; // Shift purely visual drawing up slightly
      
      if (isDragged) {
        // Visual lift effect!
        drawWidth *= 1.3;
        drawHeight *= 1.3;
        dx = px - (drawWidth - charSize)/2;
        dy -= 20; // Lift up in the air
        
        // Shadow effect
        renderer.ctx.fillStyle = "rgba(0,0,0,0.3)";
        renderer.ctx.beginPath();
        renderer.ctx.ellipse(px + charSize/2, py + charSize/2, charSize * 0.4, charSize * 0.2, 0, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        // Face down and wiggle legs
        row = 0;
        flip = false;
        col = (Date.now() % 400 > 200) ? 0 : 2; // Wiggle!
      }
      
      if (isSelected) {
        renderer.drawOutline(dx - 1, dy - 1, drawWidth + 2, drawHeight + 2, "rgba(255, 255, 255, 0.8)", 2);
      }

      if (flip) {
        renderer.drawFlippedImage(img, sx, sy, fw, fh, dx, dy, drawWidth, drawHeight);
      } else {
        renderer.drawImage(img, sx, sy, fw, fh, dx, dy, drawWidth, drawHeight);
      }
    } else {
      // Fallback
      renderer.drawRect(px + tileSize*0.1, py + tileSize*0.1, tileSize*0.8, tileSize*0.8, this.color);
    }
    
    // Removed on-canvas status box as requested (using Sidebar instead)
  }
}
