// Shared content loader: KDL text -> plain objects -> zod. Imports nothing from the shell.
import { parse, type Node as KdlNode } from 'kdljs';
import { z } from 'zod';

/** A child node as schemas see it, its own children (a word's block, `every 8 { pull 3 }`) carried the same way. */
export type Child = { name: string; args: unknown[]; props: Record<string, unknown>; children: Child[] };
const child = (c: KdlNode): Child => ({ name: c.name, args: c.values, props: c.properties, children: c.children.map(child) });

/**
 * Top-level nodes must be `<kind> "<id>" key=value ... { children }`, where kind is a key of `schemas`. Returns kind -> id -> validated
 * value, in file order; ids are unique across all kinds. Each node reaches its schema as `{ ...props, id, children: [{ name, args, props }] }`,
 * so a prop named `id` or `children` is clobbered. Children nest: each carries its own `children`.
 */
export function loadKdl<M extends Record<string, z.ZodType>>(src: string, schemas: M): { [K in keyof M]: Record<string, z.output<M[K]>> } {
  const kinds = Object.keys(schemas);
  const { output, errors } = parse(src);
  if (errors.length) {
    const e = errors[0] as { message?: string; token?: { startLine?: number | null; startColumn?: number | null }; previousToken?: { startLine?: number | null; startColumn?: number | null } };
    const t = Number.isFinite(e.token?.startLine) ? e.token : e.previousToken; // EOF errors carry no position of their own
    throw new Error(`${kinds.join('/')}: KDL syntax error at ${t?.startLine ?? '?'}:${t?.startColumn ?? '?'}: ${e.message ?? 'parse failed'}`);
  }
  const out: Record<string, Record<string, unknown>> = Object.fromEntries(kinds.map((k) => [k, {}]));
  const seen = new Set<string>();
  const problems: string[] = [];
  for (const n of output ?? []) {
    const schema = Object.hasOwn(schemas, n.name) ? schemas[n.name] : undefined; // own keys only: `constructor` is not a kind
    const id = n.values[0];
    if (!schema) { problems.push(`expected node ${kinds.map((k) => `"${k}"`).join(' or ')}, found "${n.name}"`); continue; }
    if (typeof id !== 'string') { problems.push(`${n.name}: missing string id`); continue; }
    if (seen.has(id)) { problems.push(`${n.name} "${id}": duplicate id`); continue; }
    seen.add(id);
    const r = schema.safeParse({ ...n.properties, id, children: n.children.map(child) });
    if (r.success) out[n.name]![id] = r.data;
    else for (const i of r.error.issues) problems.push(`${n.name} "${id}": ${i.path.join('.')}: ${i.message}`);
  }
  if (problems.length) throw new Error(problems.join('\n'));
  return out as { [K in keyof M]: Record<string, z.output<M[K]>> };
}

/**
 * A word's signature when its arguments aren't all plain numbers. `args` are positional: 'n' a number, 's' a string (a card
 * id, a tag). `opts` are named options: a number or string is the default, 'n' / 's' are required, 'n?' / 's?' optional
 * (absent: undefined), a list of strings is a choice whose first entry is the default. `flags` are bare identifiers after the
 * args (`units-only`), true when present. `block` takes other words in braces (`every 8 { pull 3 }`), parsed with the
 * same registry.
 */
export type WordSig = {
  args?: readonly ('n' | 's')[];
  opts?: Record<string, number | string | readonly string[]>;
  flags?: readonly string[];
  block?: boolean;
};
type ArgsOf<A> = { -readonly [I in keyof A]: A[I] extends 'n' ? number : string };
type OptOf<V> = V extends 'n' | number ? number : V extends 'n?' ? number | undefined : V extends 's?' ? string | undefined
  : V extends readonly (infer C)[] ? C : string;
type OptsOf<O, F extends readonly string[]> = { -readonly [K in keyof O]: OptOf<O[K]> } & { [K in F[number]]: boolean };
export type Word<T> = { sig: WordSig; make: (args: unknown[], opts: Record<string, unknown>, block: never[]) => T };
/** A registry entry: plain numbers (`(n) => ...`, arity checked), or a `word(sig, make)`. */
export type Maker<T> = ((...args: number[]) => T) | Word<T>;

/** A word with a signature: `word({ args: ['s', 'n'] }, ([tag, n]) => ...)`, `word({ opts: { width: 'n?' }, flags: ['units-only'] }, (_, o) => ...)`. */
export function word<T, const A extends readonly ('n' | 's')[] = [], const O extends Record<string, number | string | readonly string[]> = {}, const F extends readonly string[] = [], B = never>(
  sig: { args?: A; opts?: O; flags?: F; block?: boolean },
  make: (args: ArgsOf<A>, opts: OptsOf<O, F>, block: B[]) => T,
): Word<T> {
  return { sig, make: make as unknown as Word<T>['make'] };
}

const ChildSchema: z.ZodType<Child> = z.lazy(() => z.strictObject({ name: z.string(), args: z.array(z.unknown()), props: z.record(z.string(), z.unknown()), children: z.array(ChildSchema).default([]) }));

/**
 * Schema over a node's children: each child names a word in `registry` and its arguments feed it, giving T[].
 * The one pattern all content uses to attach behaviour by name; `what` words the errors ("ability", "effect", ...).
 */
export function combinators<T>(registry: Record<string, Maker<T>>, what: string) {
  return z.array(ChildSchema).transform((cs, ctx): T[] => {
    const parse = (cs: Child[], path: (string | number)[]): T[] => cs.flatMap((c, i) => {
      const at = [...path, i];
      const bad = (message: string) => (ctx.issues.push({ code: 'custom', message, input: c, path: at }), []);
      const make = Object.hasOwn(registry, c.name) ? registry[c.name] : undefined; // own keys only: `toString` is not a combinator
      if (!make) return bad(`unknown ${what} "${c.name}" (known: ${Object.keys(registry).join(', ')})`);
      const me = `${what} "${c.name}"`;
      if (typeof make === 'function') {
        if (Object.keys(c.props).length || c.children.length) return bad(`${me}: takes only number arguments`);
        if (c.args.length !== make.length || !c.args.every((a) => typeof a === 'number')) return bad(`${me}: expected ${make.length} number argument(s)`);
        return [make(...(c.args as number[]))];
      }
      const { args = [], opts = {}, flags = [], block = false } = make.sig;
      const pos = c.args.slice(0, args.length), rest = c.args.slice(args.length);
      if (pos.length < args.length) return bad(`${me}: expected ${args.length} argument(s): ${args.map((a) => (a === 'n' ? 'a number' : 'a string')).join(', ')}`);
      const wrong = pos.findIndex((a, j) => typeof a !== (args[j] === 'n' ? 'number' : 'string'));
      if (wrong >= 0) return bad(`${me}: argument ${wrong + 1} should be ${args[wrong] === 'n' ? 'a number' : 'a string (an id or tag)'}`);
      const unknown = Object.keys(c.props).find((k) => !Object.hasOwn(opts, k));
      if (unknown) return bad(`${me}: unknown option ${unknown}= (${Object.keys(opts).length ? `options: ${Object.keys(opts).join(', ')}` : 'it takes none'})`);
      const o: Record<string, unknown> = {};
      for (const f of flags) o[f] = false;
      for (const r of rest) {
        if (typeof r !== 'string' || !flags.includes(r)) return bad(`${me}: unexpected argument ${JSON.stringify(r)}${flags.length ? ` (flags: ${flags.join(', ')})` : ''}`);
        o[r] = true;
      }
      for (const [k, spec] of Object.entries(opts)) {
        const v = c.props[k];
        if (Array.isArray(spec)) {
          if (v === undefined) o[k] = spec[0];
          else if (!spec.includes(v as string)) return bad(`${me}: ${k}= should be one of: ${spec.join(', ')}`);
          else o[k] = v;
          continue;
        }
        const type = typeof spec === 'number' || spec === 'n' || spec === 'n?' ? 'number' : 'string';
        if (v === undefined) {
          if (spec === 'n' || spec === 's') return bad(`${me}: needs ${k}=`);
          o[k] = spec === 'n?' || spec === 's?' ? undefined : spec;
        } else if (typeof v !== type) return bad(`${me}: ${k}= should be a ${type}`);
        else o[k] = v;
      }
      if (!block && c.children.length) return bad(`${me}: takes no block`);
      if (block && !c.children.length) return bad(`${me}: needs a block { ... } of words`);
      const inner = block ? parse(c.children, [...at, 'children']) : [];
      return [make.make(pos, o, inner as never[])];
    });
    return parse(cs, []);
  });
}

/** String schema that replaces `{a.b.0}` with the number/string found by walking `table` along that path, so descriptions quote tuning without copying it. */
export function tunedText(table: object) {
  return z.string().transform((text, ctx) => text.replace(/\{([\w.]+)\}/g, (whole, path: string) => {
    const v = path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], table);
    if (typeof v === 'number' || typeof v === 'string') return String(v);
    ctx.issues.push({ code: 'custom', message: `unknown tuning "${whole}"`, input: text });
    return whole;
  }));
}
