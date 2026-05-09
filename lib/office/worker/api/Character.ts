import { Renderer } from '../../engine/Renderer';
import { Point } from '../../engine/Pathfinding';
import { SpriteLoader } from '../../engine/SpriteLoader';

// Finite State Machine statuses
export const CharacterState = {
  IDLE: "IDLE",
  WALK: "WALK",
  WORK: "WORK",
  PONDERING: "PONDERING",
  ERROR: "ERROR"
} as const;

export type CharacterState = typeof CharacterState[keyof typeof CharacterState];

export class Character {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  spriteIndex: number;
  state: CharacterState = CharacterState.IDLE;
  public assignedDeskKey: string | null = null;
  public nearbyPOI: string | null = null;
  
  private path: Point[] = [];
  private baseMoveSpeed: number = 6; // Tiles per second
  public onReachDestination?: () => void;
  
  // Animation state
  public direction: number = 0; // 0=down, 1=left, 2=right, 3=up
  private frameTime: number = 0;
  private animFrame: number = 1; // 0, 1, 2 frames for walk
  public chatMessage: boolean = false;
  public chatTimer: number = 0;
  
  // Task Queue System
  public taskQueue: { 
    id: string,
    task: string, 
    priority: 'high' | 'medium' | 'low',
    urgency: number, // 0.0 - 1.0 (1.0 is most urgent)
    dependencies?: string[],
    isBackground?: boolean,
    resolve: (val: any) => void, 
    reject: (err: any) => void 
  }[] = [];
  public activeBackgroundTasks: { id: string, task: string, progress: number }[] = [];
  public completedTaskIds: Set<string> = new Set();
  public isProcessingTask: boolean = false;
  
  // AI Model Parameters (Overrides)
  public aiConfig: {
    temperature: number;
    topP: number;
    topK: number;
    model: string;
    autonomousLoop?: boolean;
  } = {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    model: 'gemini-3-flash-preview',
    autonomousLoop: true
  };
  
  // Persona Simulation Traits
  public mbti: string;
  public profession: string;
  public stance: string;
  public influence: number;
  public bio: string;
  
  // Stats
  public health: number;
  public intelligence: number;
  public totalTasksCompleted: number = 0;

  // Cooldowns
  public lastAutonomousCycle: number = 0;
  public autonomousCycleCooldown: number = 60000; // Default 60s
  public lastProactiveDiscussion: number = 0;
  public proactiveDiscussionCooldown: number = 120000; // Default 120s
  public retryCooldown: number = 0; // Cooldown for API rate limits

  // Memory System
  public memory: { id: string; timestamp: number; type: 'interaction' | 'fact' | 'outcome'; content: string; accessCount: number; lastAccessed: number }[] = [];
  
  // Team Dynamics
  public relationships: Record<string, { affinity: number, notes: string }> = {};

  public updateRelationship(targetName: string, affinityChange: number, note?: string) {
      if (!this.relationships[targetName]) {
          this.relationships[targetName] = { affinity: 0, notes: "" };
      }
      this.relationships[targetName].affinity += affinityChange;
      this.relationships[targetName].affinity = Math.max(-100, Math.min(100, this.relationships[targetName].affinity));
      
      if (note) {
          const lines = this.relationships[targetName].notes ? this.relationships[targetName].notes.split('\n') : [];
          lines.push(`- ${note}`);
          // Keep only last 5 notes
          if (lines.length > 5) lines.shift();
          this.relationships[targetName].notes = lines.join('\n');
      }
  }

  public getRelationshipsSummary(): string {
      const rels = Object.keys(this.relationships);
      if (rels.length === 0) return "No established relationships yet.";
      
      return rels.map(name => {
          const rel = this.relationships[name];
          let status = "Neutral";
          if (rel.affinity >= 50) status = "Strong Alliance";
          else if (rel.affinity >= 20) status = "Friendly";
          else if (rel.affinity <= -50) status = "Bitter Rivalry";
          else if (rel.affinity <= -20) status = "Hostile";
          
          return `${name}: ${status} (Affinity: ${rel.affinity})\n${rel.notes ? '   Notes:\n   ' + rel.notes : ''}`;
      }).join('\n\n');
  }

  public addMemory(type: 'interaction' | 'fact' | 'outcome', content: string) {
      const now = Date.now();
      this.memory.unshift({ 
          id: `mem_${now}_${Math.floor(Math.random() * 10000)}`,
          timestamp: now, 
          type, 
          content,
          accessCount: 1,
          lastAccessed: now
      });
      // Keep only up to 40 memories, prune the least relevant ones
      if (this.memory.length > 40) {
          this.pruneMemories();
      }
  }

  public currentGoal: string = "Execute assigned directives effectively.";

  public updateGoal(newGoal: string) {
      if (this.currentGoal !== newGoal) {
          this.currentGoal = newGoal;
          this.addMemory('fact', `Adopted a new primary goal: ${newGoal}`);
      }
  }

  public calculateMemoryRelevance(m: typeof this.memory[0], now: number): number {
      const ageMinutes = (now - m.timestamp) / (1000 * 60);
      const staleMinutes = (now - m.lastAccessed) / (1000 * 60);
      const lowerContent = m.content.toLowerCase();
      const professionLower = this.profession?.toLowerCase() || '';
      
      // 1. Rehearsal Effect: Memories accessed often stay relevant longer.
      // Diminishing returns applied to rehearsal
      const rehearsalStrength = Math.log1p(m.accessCount); 
      const persistenceModifier = 1 + (rehearsalStrength * 0.2); 
      
      // 2. Base Integrity: Very rapid decay curve for active memory
      // Exponential decay: e^(-t/tau). Smaller tau = faster decay.
      const recencyScore = 40 * Math.exp(-ageMinutes / (8 * persistenceModifier));
      const activationRecency = 30 * Math.exp(-staleMinutes / (3 * persistenceModifier));
      
      // 3. Type-based Significance
      let typeScore = 0;
      if (m.type === 'fact') typeScore = 15;      
      if (m.type === 'outcome') typeScore = 12;   
      
      // Dynamic Social Scoring for Interactions
      if (m.type === 'interaction') {
          typeScore = 10; // Base for interactions
          
          // Enhance interaction relevance based on social anchors (who was involved?)
          let maxAffinityFound = 0;
          let interactionFreq = 0;
          for (const entityName of Object.keys(this.relationships)) {
              if (lowerContent.includes(entityName.toLowerCase())) {
                  const rel = this.relationships[entityName];
                  const affinity = Math.abs(rel.affinity);
                  maxAffinityFound = Math.max(maxAffinityFound, affinity);
                  interactionFreq += 1;
              }
          }
          // High stakes relationships make interactions much more relevant
          typeScore += (maxAffinityFound / 5) + (interactionFreq * 2); 
      }
      
      // 4. Personality & Cognitive Bias (MBTI-driven)
      let traitAlignment = 0;
      
      const isIntrovert = this.mbti.startsWith('I');
      const isExtrovert = this.mbti.startsWith('E');
      const isSensing = this.mbti.includes('S');
      const isIntuitive = this.mbti.includes('N');
      const isThinking = this.mbti.includes('T');
      const isFeeling = this.mbti.includes('F');
      const isJudging = this.mbti.endsWith('J');

      // Higher Baseline Relevance for Goal and Profession
      if (professionLower && lowerContent.includes(professionLower)) {
          traitAlignment += 40; // Critical baseline bootstrap for profession relevance
      }
      
      // Explicit Goal Tracking Baseline Boost
      if (this.currentGoal) {
          const goalWords = this.currentGoal.toLowerCase().split(' ').filter(w => w.length > 3);
          if (goalWords.some(w => lowerContent.includes(w))) {
              traitAlignment += 30; // Very high baseline relevance for goal-aligned memories
          }
          const goalMatchCount = goalWords.filter(w => lowerContent.includes(w)).length;
          traitAlignment += (goalMatchCount * 15);
      }
      
      if (isThinking && (m.type === 'fact' || m.type === 'outcome')) traitAlignment += 8;
      if (isFeeling && m.type === 'interaction') traitAlignment += 8;
      if (isSensing && m.type === 'fact') traitAlignment += 6; 
      if (isIntuitive && m.type === 'outcome') traitAlignment += 6;
      if (isJudging && m.type === 'outcome') traitAlignment += 4;
      if (isExtrovert && m.type === 'interaction') traitAlignment += 5;
      
      // 5. Contextual & State Influence
      if (this.health < 40 && (lowerContent.includes('health') || lowerContent.includes('rest') || lowerContent.includes('hurt'))) {
          traitAlignment += 25;
      }

      if (this.state === CharacterState.WORK) {
          if (m.type === 'fact' || m.type === 'outcome') traitAlignment += 12;
      } else if (this.state === CharacterState.IDLE) {
          if (m.type === 'interaction') traitAlignment += 10;
      }

      // 6. Social Resonance (Relationship Context)
      let relationshipWeight = 0;
      for (const entityName of Object.keys(this.relationships)) {
          if (lowerContent.includes(entityName.toLowerCase())) {
              const affinity = Math.abs(this.relationships[entityName].affinity);
              // Powerful social connections (friends or enemies) anchor the memory
              relationshipWeight += (affinity / 10);
          }
      }
      
      return recencyScore + activationRecency + typeScore + traitAlignment + relationshipWeight;
  }

  private pruneMemories() {
      const now = Date.now();
      // Sort in descending order of relevance 
      this.memory.sort((a, b) => this.calculateMemoryRelevance(b, now) - this.calculateMemoryRelevance(a, now));
      
      // Further optimize by aggressively clamping to 40 items to force pruning of the lowest tier
      this.memory = this.memory.slice(0, 40);
  }

  public getRecentMemories(limit: number = 10): string {
      // Sort by timestamp descending to get actual true recent
      const recent = [...this.memory].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
      return recent
          .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.type.toUpperCase()}: ${m.content}`)
          .join('\n');
  }

  public queryMemories(query: string, limit: number = 10): string {
      const now = Date.now();
      const stopWords = new Set(['the', 'for', 'about', 'with', 'this', 'that', 'from', 'want', 'tell', 'know', 'please', 'think', 'thought', 'feel', 'seems', 'looking']);
      
      // Fuzzy matching helper
      const getFuzzyScore = (text: string, term: string) => {
          const t = term.toLowerCase();
          const content = text.toLowerCase();
          
          if (content.includes(t)) return 1.0;
          
          // Stemming-like fuzzy check
          if (t.length > 4) {
            const stems = [
              t.substring(0, t.length - 1),
              t.substring(0, t.length - 2),
              t.substring(0, Math.ceil(t.length * 0.75))
            ];
            for (let i = 0; i < stems.length; i++) {
              if (content.includes(stems[i])) return 0.8 - (i * 0.1);
            }
          }
          
          return 0;
      };

      // 1. Normalize and Extract Logical Tokens
      let normalizedQuery = query
        .replace(/&&/g, ' AND ')
        .replace(/\|\|/g, ' OR ')
        .replace(/!/g, ' NOT ')
        .replace(/\+/g, ' AND ')
        .replace(/ -/g, ' NOT '); 

      const tokens = normalizedQuery.split(/\s+/);
      const required = new Set<string>();
      const excluded = new Set<string>();
      const optional = new Set<string>();
      
      let currentMode: 'AND' | 'OR' | 'NOT' | 'DEFAULT' = 'DEFAULT';

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const upper = token.toUpperCase();
        
        if (upper === 'AND') { currentMode = 'AND'; continue; }
        if (upper === 'NOT') { currentMode = 'NOT'; continue; }
        if (upper === 'OR') { currentMode = 'OR'; continue; }

        const clean = token.toLowerCase().replace(/[^\w]/g, '');
        if (clean.length < 2) continue;
        if (stopWords.has(clean) && currentMode === 'DEFAULT') continue;

        if (currentMode === 'AND') required.add(clean);
        else if (currentMode === 'NOT') excluded.add(clean);
        else optional.add(clean);

        if (currentMode !== 'DEFAULT') currentMode = 'DEFAULT';
      }

      const allSearchTerms = [...new Set([...required, ...optional])];
      const excludedTerms = Array.from(excluded);
      const requiredTerms = Array.from(required);
      
      const lowerQuery = query.toLowerCase();
      const isRecencyQuery = lowerQuery.includes('recent') || lowerQuery.includes('today') || lowerQuery.includes('now');
      const isHistoricalQuery = lowerQuery.includes('past') || lowerQuery.includes('before') || lowerQuery.includes('history');

      if (allSearchTerms.length === 0 && !isRecencyQuery) {
          return this.getRecentMemories(limit);
      }

      const goalKeywords = this.currentGoal.toLowerCase().split(/\s+/).filter(k => k.length > 3 && !stopWords.has(k));

      const scoredMemories = this.memory.map(m => {
          let score = 0;
          const contentLower = m.content.toLowerCase();
          const ageMinutes = (now - m.timestamp) / (1000 * 60);
          
          // BOOLEAN FILTERS
          if (excludedTerms.length > 0 && excludedTerms.some(term => contentLower.includes(term))) {
              return { memory: m, score: -1000 };
          }
          if (requiredTerms.length > 0 && !requiredTerms.every(term => contentLower.includes(term))) {
              return { memory: m, score: -1000 };
          }
          
          const matchedAny = allSearchTerms.length === 0 || allSearchTerms.some(term => getFuzzyScore(contentLower, term) > 0);
          if (!matchedAny) {
              return { memory: m, score: -500 }; 
          }

          // SCORING FUZZY LOGIC
          let matchedCount = 0;
          for (const keyword of allSearchTerms) {
              const fuzzy = getFuzzyScore(contentLower, keyword);
              if (fuzzy > 0) {
                  const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                  const matches = contentLower.match(regex);
                  const multiplier = matches ? matches.length : 1;
                  score += fuzzy * multiplier * (5 + keyword.length * 0.5);
                  matchedCount += fuzzy;
              }
          }

          // Synergy bonus
          if (allSearchTerms.length > 1 && matchedCount > 1) {
              score += (matchedCount / allSearchTerms.length) * 35;
          }

          // Temporal Boost
          if (isRecencyQuery) score += Math.max(0, 40 - ageMinutes * 1.5);
          else if (isHistoricalQuery) score += Math.min(25, ageMinutes * 0.4);

          // State-Based Context Bonus
          // If the agent is currently working, favor facts and outcomes
          if (this.state === CharacterState.WORK && (m.type === 'fact' || m.type === 'outcome')) score += 15;
          // If the agent was recently interacting, favor those interactions
          if (ageMinutes < 5 && m.type === 'interaction') score += 20;

          // Goal Alignment
          for (const gk of goalKeywords) {
              if (contentLower.includes(gk)) score += 15;
          }

          // Profession-Specific Filtering
          if (this.profession && contentLower.includes(this.profession.toLowerCase())) score += 20;

          // Intrinsic Significance
          score += (this.calculateMemoryRelevance(m, now) * 0.6);

          // Social Context
          for (const [name] of Object.entries(this.relationships)) {
              if (lowerQuery.includes(name.toLowerCase()) && contentLower.includes(name.toLowerCase())) {
                  score += 25;
              }
          }

          return { memory: m, score };
      });

      const relevant = scoredMemories
          .filter(sm => sm.score >= 5.0) 
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(sm => {
              sm.memory.accessCount += 1;
              sm.memory.lastAccessed = Date.now();
              return sm.memory;
          });

      if (relevant.length === 0) {
          const contextual = [...this.memory]
              .sort((a, b) => this.calculateMemoryRelevance(b, now) - this.calculateMemoryRelevance(a, now))
              .slice(0, 3);
          
          if (contextual.length > 0) {
              return "No specific matches found for logic operands. Neural context:\n" + 
                contextual.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.type.toUpperCase()}: ${m.content}`).join('\n');
          }
          return "Neural pathways are dark. No pertinent memories retrieved.";
      }

      return relevant
          .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.type.toUpperCase()}: ${m.content}`)
          .join('\n');
  }
  
  constructor(id: string, name: string, x: number, y: number, color: string, spriteIndex: number = 0) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.color = color;
    this.spriteIndex = spriteIndex;
    
    // Generate AI Persona traits
    const mbtiTypes = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
    const professions = ["Data Analyst", "Security Expert", "Junior Dev", "Senior Engineer", "Product Manager", "Researcher"];
    const stances = ["supportive", "opposing", "neutral", "observer"];
    
    this.mbti = mbtiTypes[0];
    this.profession = professions[0];
    this.stance = stances[0];
    this.influence = 1.0;
    this.bio = `${name} is an AI ${this.profession}.`;
    
    // Default Stats
    this.health = 100;
    this.intelligence = 100;
  }

  setPath(newPath: Point[]) {
    this.path = newPath;
    if (this.path.length > 0) {
      this.state = CharacterState.WALK;
    }
  }

  public update(dt: number) {
    // Process background tasks (Non-blocking simulated work)
    if (this.activeBackgroundTasks.length > 0) {
      this.activeBackgroundTasks.forEach(bt => {
        // Intelligence affects work speed
        bt.progress += dt * (this.intelligence / 40); 
      });
      
      this.activeBackgroundTasks = this.activeBackgroundTasks.filter(bt => {
        if (bt.progress >= 100) {
          this.completedTaskIds.add(bt.id);
          this.addMemory('outcome', `[BACKGROUND TASK COMPLETE] Finished: ${bt.task.substring(0, 40)}`);
          return false;
        }
        return true;
      });
    }

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
        
        const currentMoveSpeed = this.baseMoveSpeed;

        const moveDist = currentMoveSpeed * dt;

        if (dist <= moveDist) {
          this.x = target.x;
          this.y = target.y;
          this.path.shift();
          
          if (this.path.length === 0) {
            this.state = CharacterState.IDLE;
            this.animFrame = 1;
            if (this.onReachDestination) {
              this.onReachDestination();
              this.onReachDestination = undefined;
            }
          }
        } else {
          this.x += (dx / dist) * moveDist;
          this.y += (dy / dist) * moveDist;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          this.direction = dx > 0 ? 2 : 1;
        } else if (dy !== 0) {
          this.direction = dy > 0 ? 0 : 3;
        }
      } else {
        this.state = CharacterState.IDLE;
        this.animFrame = 1;
        this.direction = 3;
      }
    }
    
    if (this.state === CharacterState.IDLE) {
       // Manual character update logic
       // processNextTaskFromQueue is disabled as task logic is handled by React component
    }
  }

  private async processNextTaskFromQueue() {
      if (this.taskQueue.length === 0 || this.isProcessingTask) return;
      
      // Sophisticated Prioritization
      // Final Score = PriorityWeight + UrgencyComponent - HealthPenalty
      const priorityWeights = { high: 500, medium: 200, low: 50 };
      
      // Find tasks whose dependencies are met
      const readyTasks = this.taskQueue.filter(t => {
        if (!t.dependencies || t.dependencies.length === 0) return true;
        return t.dependencies.every(depId => this.completedTaskIds.has(depId));
      });

      if (readyTasks.length === 0) return;

      readyTasks.sort((a, b) => {
          const scoreA = priorityWeights[a.priority] + (a.urgency * 300) - (100 - this.health);
          const scoreB = priorityWeights[b.priority] + (b.urgency * 300) - (100 - this.health);
          return scoreB - scoreA;
      });
      
      const taskItem = readyTasks[0];

      // Handle background tasks: They move to a non-blocking queue
      if (taskItem.isBackground) {
          const index = this.taskQueue.findIndex(t => t.id === taskItem.id);
          this.taskQueue.splice(index, 1);
          this.activeBackgroundTasks.push({ id: taskItem.id, task: taskItem.task, progress: 0 });
          this.addMemory('fact', `System: Starting background task: ${taskItem.task}`);
          taskItem.resolve("Pushed to background processing");
          return;
      }

      // Removed background task block as it's now handled by the state if needed, 
      // but basically background tasks run independently in the update loop above.

      // Remove from main queue
      const qIdx = this.taskQueue.findIndex(t => t.id === taskItem.id);
      this.taskQueue.splice(qIdx, 1);

      this.isProcessingTask = true;
      this.state = CharacterState.WORK;
      
      // Complexity calculation
      const baseComplexity = 4000;
      const intelligenceBonus = this.intelligence * 25;
      const healthPenalty = (100 - this.health) * 5;
      const workDuration = Math.max(1000, baseComplexity - intelligenceBonus + healthPenalty);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('node_processing_start', { 
            detail: { agentId: this.id, task: taskItem.task, priority: taskItem.priority } 
        }));
      }

      setTimeout(() => {
          this.isProcessingTask = false;
          this.state = CharacterState.IDLE;
          this.totalTasksCompleted++;
          this.completedTaskIds.add(taskItem.id);
          
          this.addMemory('outcome', `[COMPLETED] ${taskItem.task.substring(0, 40)}... (Task ID: ${taskItem.id})`);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('node_processing_complete', { 
                detail: { agentId: this.id, outcome: "Success", priority: taskItem.priority } 
            }));
          }
          
          taskItem.resolve("Task Success");
      }, workDuration);
  }

  draw(renderer: Renderer, tileSize: number, isSelected: boolean, isDragged: boolean = false) {
    // Top-left draw offset
    const px = this.x * tileSize;
    const py = this.y * tileSize; 

    const charSize = tileSize;
    let stanceIcon = "";
    let statusColorOverride = "";

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

      const time = Date.now();
      const characterSeed = this.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

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
      let drawWidth = charSize * 0.9; 
      let drawHeight = drawWidth * (fh / fw);
      
      let dx = px - (drawWidth - charSize)/2;
      let dy = py - (drawHeight - charSize) - charSize * 0.2; 
      
      // MBTI Glow Color
      let glowColor = "rgba(255, 255, 255, 0)";
      if (this.mbti.includes("TJ") || this.mbti.includes("TP")) { glowColor = "rgba(168, 85, 247, 0.4)"; } // Purple (Analysts)
      else if (this.mbti.includes("FJ") || this.mbti.includes("FP")) { glowColor = "rgba(34, 197, 94, 0.4)"; } // Green (Diplomats)
      else if (this.mbti.includes("SJ")) { glowColor = "rgba(59, 130, 246, 0.4)"; } // Blue (Sentinels)
      else { glowColor = "rgba(234, 179, 8, 0.4)"; } // Yellow (Explorers)

      // Advanced Idle animation behavior
      if (this.state === CharacterState.IDLE && !isDragged) {
          const isIntrovert = this.mbti.startsWith('I');
          const isExtrovert = this.mbti.startsWith('E');
          const isIntuitive = this.mbti.includes('N');
          const isThinking = this.mbti.includes('T');
          const isSensing = this.mbti.includes('S');
          const isJudging = this.mbti.endsWith('J');
          const isPerceiving = this.mbti.endsWith('P');

          // 1. Environment Awareness
          if (this.nearbyPOI === "server") {
              // Analyze servers
              if (isIntuitive) {
                  stanceIcon = time % 2000 < 1000 ? "⚡" : "🔍";
                  statusColorOverride = "rgba(0, 255, 255, 0.3)"; // Cyan electronic hum
              } else {
                  stanceIcon = "❄️"; // It's cold near the servers
              }
              const shiver = Math.sin(time / 50) * 0.5;
              dx += shiver;
          } else if (this.nearbyPOI === "meeting") {
              if (isExtrovert) {
                  stanceIcon = "📢";
                  dy -= Math.abs(Math.sin(time / 400)) * 3; // Impatiently jumping
              } else {
                  stanceIcon = "📋"; // Taking notes
              }
          } else if (this.nearbyPOI === "desk") {
              if (isJudging) {
                  stanceIcon = "📁";
              } else {
                  stanceIcon = "☕";
              }
          }

          // 2. Personality Animation Overlays
          if (isThinking && isIntuitive) { // NT Analysts: Pondering deeply
              const oscillate = Math.sin(time / 1500 + characterSeed);
              if (oscillate > 0.8) {
                  stanceIcon = "🧩";
                  this.direction = (Math.floor(time / 1000) % 2 === 0) ? 1 : 2; // Looking side to side
              }
          }

          if (isExtrovert && !this.nearbyPOI) { // Socializing or wanting to
              if (time % 5000 > 4500) {
                  stanceIcon = "👋";
                  dy -= 2;
              }
          }

          if (isIntrovert) { // Quiet focus or hiding
              const breathe = Math.sin(time / 2000 + characterSeed) * 2;
              drawHeight += breathe;
              dy -= breathe;
          }

          // 3. Stance Logic
          if (this.stance === "supportive") {
              const bounceFreq = isExtrovert ? 250 : 500;
              const bounce = Math.abs(Math.sin(time / bounceFreq)) * 5;
              dy -= bounce;
              if (time % 3000 > 2800) stanceIcon = "✨";
          } else if (this.stance === "opposing") {
              const jitter = (isThinking ? 0.8 : 2.2);
              dx += (Math.random() - 0.5) * jitter;
              if (time % 1000 > 900) stanceIcon = "💢";
              statusColorOverride = "rgba(255, 0, 0, 0.15)";
          } else if (this.stance === "observer") {
              if (time % 4000 > 3800) stanceIcon = "🔭";
              renderer.ctx.globalAlpha = 0.85; // Slightly transparent/faded
          }

          // 4. Randomized Micro-behaviors
          const microSeed = (time + characterSeed) % 10000;
          if (microSeed < 20) {
              // Blink or look around
              if (isPerceiving) this.direction = Math.floor(Math.random() * 4);
          }
      }
      
      if (isDragged) {
        drawWidth *= 1.3;
        drawHeight *= 1.3;
        dx = px - (drawWidth - charSize)/2;
        dy -= 20; 
        
        renderer.ctx.fillStyle = "rgba(0,0,0,0.3)";
        renderer.ctx.beginPath();
        renderer.ctx.ellipse(px + charSize/2, py + charSize/2, charSize * 0.4, charSize * 0.2, 0, 0, Math.PI * 2);
        renderer.ctx.fill();
        
        row = 0;
        flip = false;
        col = (time % 400 > 200) ? 0 : 2;
      }
      
      if (isSelected) {
        renderer.drawOutline(dx - 1, dy - 1, drawWidth + 2, drawHeight + 2, "rgba(255, 255, 255, 0.8)", 2);
      }
      
      // Draw MBTI Glow
      if (!isDragged || statusColorOverride) {
          renderer.ctx.fillStyle = statusColorOverride || glowColor;
          renderer.ctx.beginPath();
          renderer.ctx.ellipse(px + charSize/2, py + charSize/2 + charSize * 0.1, charSize * 0.45, charSize * 0.18, 0, 0, Math.PI * 2);
          renderer.ctx.fill();
      }

      if (flip) {
        renderer.drawFlippedImage(img, sx, sy, fw, fh, dx, dy, drawWidth, drawHeight);
      } else {
        renderer.drawImage(img, sx, sy, fw, fh, dx, dy, drawWidth, drawHeight);
      }
      
      renderer.ctx.globalAlpha = 1.0; // Reset alpha

      // Emoji/Icons
      if (this.state === CharacterState.PONDERING) stanceIcon = "🤔";
      else if (this.state === CharacterState.WORK || this.isProcessingTask) stanceIcon = "💭";
      else if (this.state === CharacterState.ERROR) stanceIcon = "❗";
      
      if (stanceIcon) {
          renderer.ctx.font = "14px sans-serif";
          renderer.ctx.fillStyle = "white";
          const iconY = dy - 8 + Math.sin(time / 200) * 2;
          renderer.ctx.fillText(stanceIcon, dx + drawWidth/2 - 7, iconY);
      }
    } else {
      renderer.drawRect(px + tileSize*0.1, py + tileSize*0.1, tileSize*0.8, tileSize*0.8, this.color);
    }
  }
}
