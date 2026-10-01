// Device-agnostic input. Sources (touch, keyboard, gamepad) write RawInput; the sim reads InputFrame.
export const BUTTONS = ["jump", "shoot", "parry", "blink", "ex", "lock", "pause", "swap"] as const;
export type Button = (typeof BUTTONS)[number];

export interface RawInput {
  x: number; // -1..1 stick / keys
  y: number; // -1..1 (up positive)
  held: Partial<Record<Button, boolean>>;
}

export interface InputFrame {
  mx: number; my: number; // snapped movement (-1,0,1)
  ax: number; ay: number; // snapped 8-way aim direction (unit-ish)
  held: Record<Button, boolean>;
  pressed: Record<Button, boolean>;
  released: Record<Button, boolean>;
}

const emptyButtons = () => Object.fromEntries(BUTTONS.map((b) => [b, false])) as Record<Button, boolean>;

/** Dead zone + 8-way snap. Returns [x, y] with components in {-1,0,1}. */
export function snap8(x: number, y: number, dead = 0.25): [number, number] {
  const m = Math.hypot(x, y);
  if (m < dead) return [0, 0];
  const a = Math.atan2(y, x);
  const oct = Math.round(a / (Math.PI / 4));
  const sa = oct * (Math.PI / 4);
  return [Math.round(Math.cos(sa)), Math.round(Math.sin(sa))];
}

export class InputMerger {
  sources: (() => RawInput | null)[] = [];
  private prev = emptyButtons();
  deadZone = 0.25;
  autoFire = false;

  add(src: () => RawInput | null) { this.sources.push(src); }

  /** Call exactly once per sim step. */
  frame(): InputFrame {
    let x = 0, y = 0;
    const held = emptyButtons();
    for (const s of this.sources) {
      const r = s();
      if (!r) continue;
      if (Math.abs(r.x) > Math.abs(x)) x = r.x;
      if (Math.abs(r.y) > Math.abs(y)) y = r.y;
      for (const b of BUTTONS) if (r.held[b]) held[b] = true;
    }
    if (this.autoFire) held.shoot = !held.shoot ? true : held.shoot;
    const [mx, my] = snap8(x, y, this.deadZone);
    const pressed = emptyButtons(), released = emptyButtons();
    for (const b of BUTTONS) {
      pressed[b] = held[b] && !this.prev[b];
      released[b] = !held[b] && this.prev[b];
    }
    this.prev = held;
    return { mx, my, ax: mx, ay: my, held, pressed, released };
  }
}

export const idleFrame = (): InputFrame => ({ mx: 0, my: 0, ax: 0, ay: 0, held: emptyButtons(), pressed: emptyButtons(), released: emptyButtons() });
