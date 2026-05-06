export class GameLoop {
  private lastTime: number = 0;
  private animationId: number = 0;
  private updateFn: (dt: number) => void;
  private drawFn: () => void;
  private running: boolean = false;

  constructor(updateFn: (dt: number) => void, drawFn: () => void) {
    this.updateFn = updateFn;
    this.drawFn = drawFn;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
  }

  private loop = (time: number) => {
    if (!this.running) return;
    
    // Max delta time to avoid huge spikes to game logic
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.updateFn(dt);
    this.drawFn();

    this.animationId = requestAnimationFrame(this.loop);
  };
}
