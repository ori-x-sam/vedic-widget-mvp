// Fixed-step simulation clock with hit-stop (time freeze) and slow-mo.
export const STEP = 1 / 60;

export class Clock {
  acc = 0;
  time = 0; // simulated seconds
  frame = 0; // simulated steps
  hitStop = 0; // real seconds remaining of freeze
  scale = 1;

  /** Feed real elapsed seconds; returns how many fixed steps to simulate. */
  advance(realDt: number, maxSteps = 5): number {
    realDt = Math.min(realDt, 0.1);
    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - realDt);
      return 0;
    }
    this.acc += realDt * this.scale;
    let n = 0;
    while (this.acc >= STEP && n < maxSteps) {
      this.acc -= STEP;
      n++;
    }
    if (n === maxSteps) this.acc = 0;
    this.time += n * STEP;
    this.frame += n;
    return n;
  }

  /** Interpolation alpha between last and next step, for smooth rendering. */
  get alpha() { return this.acc / STEP; }

  freeze(seconds: number) { this.hitStop = Math.max(this.hitStop, seconds); }
}

/** "On twos": quantize a time to an animation frame index at `fps` (12 by default). */
export const onTwos = (t: number, fps = 12) => Math.floor(t * fps);
/** Quantized time snapped to the animation frame start. */
export const heldTime = (t: number, fps = 12) => Math.floor(t * fps) / fps;
