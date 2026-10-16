// One button (§2.1): Space / ↑ / W / click / tap. Hold = higher jump.
// Listens on the whole page so a thumb anywhere on the phone works.

type Listener = () => void;

class OneButton {
  held = false;
  /** Presses not yet consumed by the simulation. */
  private queued = 0;
  private listeners = new Set<Listener>();
  enabled = true;

  attach(root: HTMLElement): void {
    const isUi = (t: EventTarget | null) => t instanceof Element && !!t.closest('button, a, input, .card, .palette-page');
    root.addEventListener('pointerdown', (e) => {
      if (isUi(e.target) || e.button > 0) return;
      e.preventDefault();
      this.down();
    }, { passive: false });
    const up = () => this.up();
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', up);
    window.addEventListener('keydown', (e) => {
      if (!isJumpKey(e.code)) return;
      if (isUi(document.activeElement) && document.activeElement !== document.body && e.code !== 'ArrowUp' && e.code !== 'KeyW') return;
      e.preventDefault();
      if (!e.repeat) this.down();
    });
    window.addEventListener('keyup', (e) => {
      if (isJumpKey(e.code)) this.up();
    });
  }

  private down(): void {
    if (!this.enabled) return;
    this.held = true;
    this.queued++;
    for (const l of this.listeners) l();
  }

  private up(): void {
    this.held = false;
  }

  /** Take one queued press (edge) for the current simulation step. */
  consumePress(): boolean {
    if (this.queued > 0) {
      this.queued--;
      return true;
    }
    return false;
  }

  clear(): void {
    this.queued = 0;
  }

  onPress(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}

const isJumpKey = (code: string) => code === 'Space' || code === 'ArrowUp' || code === 'KeyW';

export const input = new OneButton();
