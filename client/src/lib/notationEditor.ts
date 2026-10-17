/*
# Text editing for the move notation

The notation field is a plain text field holding e.g.  run(1,1)n;sym(jump(2,1))
These are pure functions so they can be tested without a browser:

  applyKey      what a keypad key does at the caret
  deleteToken   what del / Backspace does (removes a whole part like "jump(", not one letter)
  parseNotation text -> moves, or the reason it is not valid
  formatMoves   moves -> text
*/
import type { Move } from "@/engine/vectorNotation";

export type FeedbackKey =
  | "chooseKind"
  | "needNumber"
  | "nOnlyCount"
  | "symAtStart"
  | "finishBeforeNext"
  | "countDone"
  | "zeroZero"
  | "countMin";

export type KeyResult = { value: string; caret: number } | { error: FeedbackKey };
export type ParseResult =
  | { moves: Move[] }
  | { error: FeedbackKey | "syntax"; segment?: string };

export function formatMoves(moves: Move[]): string {
  return moves
    .map(
      (m) =>
        `${m.modifier ? `${m.modifier}(` : ""}${m.kind}(${m.x},${m.y})${m.count ?? ""}${m.modifier ? ")" : ""}`,
    )
    .join(";");
}

// --- reading --------------------------------------------------------------------

const MOVE = /^(?:(sym)\()?(run|jump)\((-?\d+),(-?\d+)\)(\d+|n)?(\))?$/;

export function parseNotation(value: string): ParseResult {
  const moves: Move[] = [];
  for (const raw of value.split(";")) {
    const segment = raw.replace(/\s+/g, "");
    if (segment === "") continue;

    const match = MOVE.exec(segment);
    // A closing ")" only belongs there when the move was opened with sym(
    if (!match || (match[6] && !match[1])) return { error: "syntax", segment };

    const [, modifier, kind, xText, yText, countText] = match;
    const x = Number(xText);
    const y = Number(yText);
    if (x === 0 && y === 0) return { error: "zeroZero" };
    if (countText === "0") return { error: "countMin" };

    const move: Move = { kind, x, y };
    if (countText) move.count = countText === "n" ? "n" : Number(countText);
    if (modifier) move.modifier = "sym";
    moves.push(move);
  }
  return { moves };
}

// --- keypad ---------------------------------------------------------------------

const insert = (value: string, start: number, end: number, text: string): KeyResult => ({
  value: value.slice(0, start) + text + value.slice(end),
  caret: start + text.length,
});

// States of the move that is being typed at the end of the text
const OPEN_SYM = /^sym\($/;
const OPEN_KIND = /^(?:sym\()?(?:run|jump)\($/;
const AFTER_X = /^(?:sym\()?(?:run|jump)\((-?\d+),$/;
const AFTER_Y = /^(?:sym\()?(?:run|jump)\(-?\d+,-?\d+\)$/;
const AFTER_COUNT = /^(?:sym\()?(?:run|jump)\(-?\d+,-?\d+\)(\d+|n)$/;

/** Closes parentheses that sym( left open, so a finished move can be followed by ";". */
const closeOpen = (segment: string) => {
  const opens = (segment.match(/\(/g) ?? []).length;
  const closes = (segment.match(/\)/g) ?? []).length;
  return segment + ")".repeat(Math.max(0, opens - closes));
};

/**
 * What a keypad key does at the caret.
 * - At the end of the text it guides you through run(x,y)count and adds the punctuation.
 * - With a selection, or with the caret inside the text, it just replaces / inserts the key,
 *   so you can swap a single digit or word without anything else moving.
 */
export function applyKey(value: string, start: number, end: number, key: string | number): KeyResult {
  const label = String(key);
  if (start !== end || start < value.length) return insert(value, start, end, label);

  const cut = value.lastIndexOf(";");
  const head = value.slice(0, cut + 1);
  const segment = value.slice(cut + 1);
  const done = (next: string): KeyResult => ({ value: head + next, caret: (head + next).length });

  const complete = AFTER_Y.test(segment) || AFTER_COUNT.test(segment);
  const known =
    segment === "" || OPEN_SYM.test(segment) || OPEN_KIND.test(segment) || AFTER_X.test(segment) || complete;
  // Text typed by hand that does not fit any step: behave like a normal text field
  if (!known) return insert(value, start, end, label);

  // Starting the next move right after a finished one separates them with ";"
  const startOfNext = (text: string): KeyResult => {
    const next = closeOpen(segment) + ";" + text;
    return { value: head + next, caret: (head + next).length };
  };

  if (label === "run" || label === "jump") {
    if (segment === "") return done(`${label}(`);
    if (OPEN_SYM.test(segment)) return done(`${segment}${label}(`);
    if (complete) return startOfNext(`${label}(`);
    return { error: "needNumber" };
  }

  if (label === "sym") {
    if (segment === "") return done("sym(");
    if (complete) return startOfNext("sym(");
    return { error: "symAtStart" };
  }

  if (/^\d$/.test(label)) {
    if (segment === "" || OPEN_SYM.test(segment)) return { error: "chooseKind" };
    if (OPEN_KIND.test(segment)) return done(`${segment}${label},`);
    const x = AFTER_X.exec(segment);
    if (x) {
      if (Number(x[1]) === 0 && label === "0") return { error: "zeroZero" };
      return done(`${segment}${label})`);
    }
    if (AFTER_Y.test(segment)) {
      if (label === "0") return { error: "countMin" };
      return done(segment + label);
    }
    // count: more digits are fine (12), but nothing after "n"
    return segment.endsWith("n") ? { error: "countDone" } : done(segment + label);
  }

  if (label === "n") {
    if (AFTER_Y.test(segment)) return done(segment + "n");
    return complete ? { error: "countDone" } : { error: "nOnlyCount" };
  }

  if (label === ";") {
    if (!complete) return { error: "finishBeforeNext" };
    return { value: head + closeOpen(segment) + ";", caret: (head + closeOpen(segment) + ";").length };
  }

  return insert(value, start, end, label);
}

/**
 * The word or number at the caret, used for double-click.
 * (A browser would select "2,1" as one word, which would replace x and y together.)
 */
export function tokenAt(value: string, index: number): { start: number; end: number } | null {
  const tokens = [...value.matchAll(/[A-Za-z]+|-?\d+/g)].map((m) => ({
    start: m.index ?? 0,
    end: (m.index ?? 0) + m[0].length,
  }));
  return tokens.find((t) => index >= t.start && index < t.end) ?? tokens.find((t) => t.end === index) ?? null;
}

// --- delete ---------------------------------------------------------------------

/**
 * Deletes the selection, or the whole part in front of the caret:
 *   "jump(" "sym(" "1," "1)" "n" "12" or a single character.
 * Repeated presses at the end of  run(1,1)n  give  run(1,1)  run(1,  run(  and an empty field.
 */
export function deleteToken(value: string, start: number, end: number): { value: string; caret: number } {
  if (start !== end) return { value: value.slice(0, start) + value.slice(end), caret: start };
  if (start === 0) return { value, caret: 0 };

  const before = value.slice(0, start);
  let after = value.slice(start);
  let removed = 1;

  const part = /(?:run|jump|sym)\($/.exec(before);
  if (part) {
    removed = part[0].length;
    // an empty pair sym(|) or run(|) loses its closing parenthesis too
    if (after.startsWith(")")) after = after.slice(1);
  } else {
    const pattern = [/-?\d+,$/, /-?\d+\)$/, /[A-Za-z]+$/, /-?\d+$/, /\s+$/]
      .map((p) => p.exec(before))
      .find(Boolean);
    if (pattern) removed = pattern[0].length;
  }

  const next = before.slice(0, before.length - removed);
  return { value: next + after, caret: next.length };
}
