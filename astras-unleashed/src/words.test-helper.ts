// Test helper: read KDL word lines with a registry, the way content does (`c "x" { ... }`).
import { z } from 'zod';
import { combinators, loadKdl, type Maker } from './content-load';

export const readWords = <T>(registry: Record<string, Maker<T>>, kdl: string): T[] =>
  loadKdl(`c "x" {\n${kdl}\n}`, { c: z.object({ id: z.string(), children: combinators(registry, 'word') }) }).c.x!.children;
export const readWord = <T>(registry: Record<string, Maker<T>>, kdl: string): T => readWords(registry, kdl)[0]!;
