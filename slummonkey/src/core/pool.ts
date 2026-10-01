// Object pool: preallocates, never allocates during play. `live` is a dense array of active items.
export class Pool<T> {
  private free: T[] = [];
  live: T[] = [];
  constructor(private make: () => T, private reset: (t: T) => void, prealloc = 0) {
    for (let i = 0; i < prealloc; i++) this.free.push(make());
  }
  get(): T {
    const t = this.free.pop() ?? this.make();
    this.reset(t);
    this.live.push(t);
    return t;
  }
  /** Release items where `dead(t)` is true, keeping `live` dense (swap-remove). */
  sweep(dead: (t: T) => boolean) {
    const l = this.live;
    for (let i = l.length - 1; i >= 0; i--) {
      if (dead(l[i])) {
        this.free.push(l[i]);
        l[i] = l[l.length - 1];
        l.pop();
      }
    }
  }
  clear() {
    for (const t of this.live) this.free.push(t);
    this.live.length = 0;
  }
  get size() { return this.live.length; }
}
