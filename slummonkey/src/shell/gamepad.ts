// Standard-mapping gamepad source: left stick/dpad, A jump, X shoot, B blink, RB parry, Y EX, LB lock, Start pause, RT shoot too.
import type { RawInput } from "../core/input";

export function gamepadSource(): () => RawInput | null {
  return () => {
    const pads = navigator.getGamepads?.() ?? [];
    const p = Array.from(pads).find((g) => g && g.connected);
    if (!p) return null;
    const b = (i: number) => !!p.buttons[i]?.pressed;
    let x = p.axes[0] ?? 0, y = -(p.axes[1] ?? 0);
    if (b(14)) x = -1; if (b(15)) x = 1; if (b(12)) y = 1; if (b(13)) y = -1;
    return { x, y, held: { jump: b(0), shoot: b(2) || b(7), blink: b(1), parry: b(5), ex: b(3), lock: b(4) || b(6), pause: b(9), swap: b(8) } };
  };
}
