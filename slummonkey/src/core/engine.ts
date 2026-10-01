// Main loop: real time -> fixed sim steps -> one render with interpolation alpha.
import { Clock, STEP } from "./clock";

export interface Scene {
  step(dt: number): void; // fixed STEP
  render(alpha: number, realDt: number): void;
}

export class Engine {
  clock = new Clock();
  scene: Scene | null = null;
  private last = 0;
  private raf = 0;
  running = false;
  fps = 60;

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      const dt = (now - this.last) / 1000;
      this.last = now;
      this.fps = this.fps * 0.95 + (1 / Math.max(dt, 1e-3)) * 0.05;
      const n = this.clock.advance(dt);
      if (this.scene) {
        for (let i = 0; i < n; i++) this.scene.step(STEP);
        this.scene.render(this.clock.alpha, dt);
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Deterministic manual stepping for tests/stories. */
  runSteps(n: number) {
    for (let i = 0; i < n; i++) this.scene?.step(STEP);
    this.scene?.render(0, STEP);
  }
}
