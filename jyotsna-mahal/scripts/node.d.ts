// The little of Node the TS scripts (run through scripts/run.mjs) use; the game itself never touches Node.
declare module 'node:fs' {
  export function writeFileSync(path: string, data: string): void;
}
