// Keyboard source (desktop testing). Arrows/WASD move+aim, Z/J jump, X/K shoot, C/L parry, Shift/; blink, V/I EX, A-lock = Ctrl/U, Tab swap.
import type { RawInput, Button } from "../core/input";

const MAP: Record<string, Button> = {
  KeyZ: "jump", KeyJ: "jump", Space: "jump",
  KeyX: "shoot", KeyK: "shoot",
  KeyC: "parry", KeyL: "parry",
  ShiftLeft: "blink", ShiftRight: "blink", Semicolon: "blink",
  KeyV: "ex", KeyI: "ex",
  ControlLeft: "lock", KeyU: "lock",
  Escape: "pause", KeyP: "pause",
  Tab: "swap", KeyQ: "swap",
};

export function keyboardSource(target: Window = window): () => RawInput {
  const down = new Set<string>();
  target.addEventListener("keydown", (e) => { down.add(e.code); if (MAP[e.code] || e.code.startsWith("Arrow")) e.preventDefault(); });
  target.addEventListener("keyup", (e) => down.delete(e.code));
  target.addEventListener("blur", () => down.clear());
  return () => {
    const x = (down.has("ArrowRight") || down.has("KeyD") ? 1 : 0) - (down.has("ArrowLeft") || down.has("KeyA") ? 1 : 0);
    const y = (down.has("ArrowUp") || down.has("KeyW") ? 1 : 0) - (down.has("ArrowDown") || down.has("KeyS") ? 1 : 0);
    const held: RawInput["held"] = {};
    for (const [k, b] of Object.entries(MAP)) if (down.has(k)) held[b] = true;
    return { x, y, held };
  };
}
