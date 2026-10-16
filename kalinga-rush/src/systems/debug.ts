// Debug URL params (brief §8): ?record=14 ?act=7 ?seed=123 ?god=1 ?twist=1 ?palette=1 ?reel=1
// plus QA helpers: ?at=12 (fast-forward seconds), ?qa=1 (freeze after fast-forward), ?auto=1 (autopilot).

export interface DebugFlags {
  record: number | null;
  act: number | null;
  seed: number | null;
  god: boolean;
  twist: boolean;
  palette: boolean;
  reel: boolean;
  qa: boolean;
  at: number;
  auto: boolean;
  assist: boolean;
}

function parse(search: string): DebugFlags {
  let q: URLSearchParams;
  try {
    q = new URLSearchParams(search);
  } catch {
    q = new URLSearchParams();
  }
  const num = (k: string) => {
    const v = q.get(k);
    if (v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const flag = (k: string) => q.get(k) === '1' || q.get(k) === 'true';
  return {
    record: num('record'),
    act: num('act'),
    seed: num('seed'),
    god: flag('god'),
    twist: flag('twist'),
    palette: flag('palette'),
    reel: flag('reel'),
    qa: flag('qa'),
    at: Math.max(0, num('at') ?? 0),
    auto: flag('auto'),
    assist: flag('assist'),
  };
}

export const DEBUG: DebugFlags = parse(typeof location !== 'undefined' ? location.search : '');
