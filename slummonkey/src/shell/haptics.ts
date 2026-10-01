// Haptics via navigator.vibrate. Patterns are short so they never feel laggy.
export class Haptics {
  enabled = true;
  pulse(kind: string, ms = 20) {
    if (!this.enabled || !("vibrate" in navigator)) return;
    const pattern: Record<string, number | number[]> = { hit: [60, 30, 40], parry: [12, 20, 18], blink: 10, super: [30, 30, 30, 30, 60] };
    try { navigator.vibrate(pattern[kind] ?? ms); } catch { /* ignore */ }
  }
}
