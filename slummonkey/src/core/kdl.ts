// Small KDL parser (KDL 2 subset, also accepts KDL 1 keywords).
// Supports: nodes, positional args, key=value props, child blocks, `;` separators,
// quoted strings, bare-identifier strings, numbers, #true/#false/#null (and true/false/null),
// // and /* */ comments, /- slashdash, `\` line continuation, (type) annotations (ignored).

export type KdlValue = string | number | boolean | null;

export interface KdlNode {
  name: string;
  args: KdlValue[];
  props: Record<string, KdlValue>;
  children: KdlNode[];
  line: number;
  file?: string;
}

export class KdlError extends Error {
  constructor(msg: string, public line: number, public file?: string) {
    super(`${file ?? "<kdl>"}:${line}: ${msg}`);
  }
}

const isWs = (c: string) => c === " " || c === "\t" || c === "﻿";
const isNl = (c: string) => c === "\n" || c === "\r";
const isIdentStop = (c: string) => isWs(c) || isNl(c) || c === "" || "{}();=\"/\\[]".includes(c);

export function parseKdl(src: string, file?: string): KdlNode[] {
  let i = 0;
  let line = 1;
  const peek = (o = 0) => src[i + o] ?? "";
  const err = (m: string) => new KdlError(m, line, file);
  const adv = () => {
    const c = src[i++] ?? "";
    if (c === "\n") line++;
    return c;
  };

  function skipBlockComment() {
    // at "/*"
    i += 2;
    let depth = 1;
    while (i < src.length && depth > 0) {
      if (peek() === "/" && peek(1) === "*") { i += 2; depth++; }
      else if (peek() === "*" && peek(1) === "/") { i += 2; depth--; }
      else adv();
    }
    if (depth > 0) throw err("unterminated block comment");
  }

  // skip spaces, block comments and line continuations (not newlines)
  function skipInline() {
    for (;;) {
      const c = peek();
      if (isWs(c)) { i++; continue; }
      if (c === "/" && peek(1) === "*") { skipBlockComment(); continue; }
      if (c === "\\") {
        i++;
        while (isWs(peek())) i++;
        if (peek() === "/" && peek(1) === "/") while (i < src.length && !isNl(peek())) i++;
        if (peek() === "\r") i++;
        if (peek() === "\n") adv();
        continue;
      }
      break;
    }
  }

  function skipLineComment() {
    while (i < src.length && !isNl(peek())) i++;
  }

  // skip whitespace, newlines and all comments between nodes
  function skipAll() {
    for (;;) {
      skipInline();
      const c = peek();
      if (isNl(c) || c === ";") { adv(); continue; }
      if (c === "/" && peek(1) === "/") { skipLineComment(); continue; }
      break;
    }
  }

  function readString(): string {
    // at opening quote
    adv();
    let out = "";
    for (;;) {
      if (i >= src.length) throw err("unterminated string");
      const c = adv();
      if (c === '"') return out;
      if (c === "\\") {
        const e = adv();
        if (e === "n") out += "\n";
        else if (e === "t") out += "\t";
        else if (e === "r") out += "\r";
        else if (e === '"') out += '"';
        else if (e === "\\") out += "\\";
        else if (e === "u") {
          if (peek() !== "{") throw err("bad unicode escape");
          adv();
          let hex = "";
          while (peek() !== "}") hex += adv();
          adv();
          out += String.fromCodePoint(parseInt(hex, 16));
        } else if (isWs(e) || isNl(e)) {
          while (isWs(peek()) || isNl(peek())) adv();
        } else out += e;
      } else out += c;
    }
  }

  function readBare(): string {
    let s = "";
    while (!isIdentStop(peek())) s += adv();
    return s;
  }

  function readType() {
    if (peek() === "(") {
      while (i < src.length && peek() !== ")") adv();
      adv();
    }
  }

  function bareToValue(s: string): KdlValue {
    if (s === "#true" || s === "true") return true;
    if (s === "#false" || s === "false") return false;
    if (s === "#null" || s === "null") return null;
    if (s === "#inf") return Infinity;
    if (s === "#-inf") return -Infinity;
    const n = s.replace(/_/g, "");
    if (/^[+-]?(\d+(\.\d+)?([eE][+-]?\d+)?|0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+)$/.test(n)) {
      if (/^[+-]?0[xbo]/.test(n)) {
        const sign = n.startsWith("-") ? -1 : 1;
        const body = n.replace(/^[+-]/, "");
        const base = body[1] === "x" ? 16 : body[1] === "b" ? 2 : 8;
        return sign * parseInt(body.slice(2), base);
      }
      return Number(n);
    }
    return s;
  }

  function readValue(): KdlValue {
    readType();
    if (peek() === '"') return readString();
    const s = readBare();
    if (!s) throw err(`unexpected character '${peek()}'`);
    return bareToValue(s);
  }

  function readNode(): KdlNode | null {
    skipAll();
    if (i >= src.length || peek() === "}") return null;
    let slashdash = false;
    if (peek() === "/" && peek(1) === "-") { i += 2; slashdash = true; skipAll(); }
    readType();
    const startLine = line;
    const name = peek() === '"' ? readString() : readBare();
    if (!name) throw err(`expected node name, found '${peek()}'`);
    const node: KdlNode = { name, args: [], props: {}, children: [], line: startLine, file };
    for (;;) {
      skipInline();
      const c = peek();
      if (c === "" || isNl(c) || c === ";") { if (c) adv(); break; }
      if (c === "}") break;
      if (c === "/" && peek(1) === "/") { skipLineComment(); break; }
      let sd = false;
      if (c === "/" && peek(1) === "-") { i += 2; sd = true; skipInline(); }
      if (peek() === "{") {
        adv();
        const kids: KdlNode[] = [];
        for (;;) {
          const k = readNode();
          if (!k) break;
          if (k.name !== "\u0000") kids.push(k);
        }
        skipAll();
        if (peek() !== "}") throw err("expected '}'");
        adv();
        if (!sd) node.children = kids;
        continue;
      }
      // property or argument
      readType();
      let key: string | null = null;
      let val: KdlValue;
      if (peek() === '"') {
        const s = readString();
        if (peek() === "=") { adv(); key = s; val = readValue(); } else val = s;
      } else {
        const s = readBare();
        if (!s) throw err(`unexpected character '${peek()}'`);
        if (peek() === "=") { adv(); key = s; val = readValue(); } else val = bareToValue(s);
      }
      if (sd) continue;
      if (key !== null) node.props[key] = val;
      else node.args.push(val);
    }
    if (slashdash) return { ...node, name: "\u0000" };
    return node;
  }

  const out: KdlNode[] = [];
  for (;;) {
    const n = readNode();
    if (!n) {
      skipAll();
      if (i < src.length) throw err(`unexpected '${peek()}'`);
      break;
    }
    if (n.name !== "\u0000") out.push(n);
  }
  return out;
}

/** Serialize nodes back to KDL text (used by the layout editor export). */
export function stringifyKdl(nodes: KdlNode[], indent = ""): string {
  const v = (x: KdlValue) =>
    typeof x === "string" ? (/^[A-Za-z_][\w\-.]*$/.test(x) && !["true", "false", "null"].includes(x) ? x : JSON.stringify(x))
    : x === null ? "#null" : typeof x === "boolean" ? (x ? "#true" : "#false") : String(+x.toFixed(4));
  return nodes.map((n) => {
    const parts = [v(n.name), ...n.args.map(v), ...Object.entries(n.props).map(([k, p]) => `${k}=${v(p)}`)];
    let s = indent + parts.join(" ");
    if (n.children.length) s += " {\n" + stringifyKdl(n.children, indent + "  ") + "\n" + indent + "}";
    return s;
  }).join("\n");
}

// ---- tiny accessors used by loaders ----
export const argNum = (n: KdlNode, i: number, d: number) => (typeof n.args[i] === "number" ? (n.args[i] as number) : d);
export const argStr = (n: KdlNode, i: number, d: string) => (n.args[i] == null ? d : String(n.args[i]));
export const propNum = (n: KdlNode, k: string, d: number) => (typeof n.props[k] === "number" ? (n.props[k] as number) : d);
export const propStr = (n: KdlNode, k: string, d: string) => (n.props[k] == null ? d : String(n.props[k]));
export const propBool = (n: KdlNode, k: string, d: boolean) => (typeof n.props[k] === "boolean" ? (n.props[k] as boolean) : d);
export const child = (n: KdlNode, name: string) => n.children.find((c) => c.name === name);
export const childrenNamed = (n: KdlNode, name: string) => n.children.filter((c) => c.name === name);
