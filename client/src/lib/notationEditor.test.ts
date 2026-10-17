// Run with:  npx tsx src/lib/notationEditor.test.ts   (from the client folder)
import { applyKey, deleteToken, formatMoves, parseNotation, tokenAt } from "./notationEditor";

let failed = 0;
function test(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS ${label}`);
  } else {
    failed++;
    console.log(`FAIL ${label}\n     expected: ${e}\n     actual:   ${a}`);
  }
}

/** Presses keys one after another with the caret at the end; returns the text, or the first error. */
function typeKeys(keys: (string | number)[], start = "") {
  let value = start;
  for (const key of keys) {
    const result = applyKey(value, value.length, value.length, key);
    if ("error" in result) return { value, error: result.error };
    value = result.value;
  }
  return { value };
}

// --- keypad at the end of the text: guided, adds the punctuation -----------------
test("run, 1, 1, n", typeKeys(["run", 1, 1, "n"]).value, "run(1,1)n");
test("run, 1, 0 gives a rook step without a count", typeKeys(["run", 1, 0]).value, "run(1,0)");
test(
  "two moves with sym",
  typeKeys(["run", 1, 1, "n", ";", "sym", "jump", 2, 1, ";"]).value,
  "run(1,1)n;sym(jump(2,1));",
);
test("a count inside sym stays inside the parentheses", typeKeys(["sym", "jump", 2, 1, 3, ";"]).value, "sym(jump(2,1)3);");
test("a multi-digit count", typeKeys(["run", 1, 0, 1, 2]).value, "run(1,0)12");
test("starting the next move closes the previous one with ;", typeKeys(["run", 1, 1, "jump"]).value, "run(1,1);jump(");
test("starting sym after a sym move closes it", typeKeys(["sym", "jump", 2, 1, "run"]).value, "sym(jump(2,1));run(");

// --- keypad mistakes give a reason and change nothing ----------------------------
test("a digit first needs a kind", typeKeys([1]).error, "chooseKind");
test("n first is not allowed", typeKeys(["n"]).error, "nOnlyCount");
test("run inside a move is rejected", typeKeys(["run", "run"]).error, "needNumber");
test("sym in the middle of a move is rejected", typeKeys(["run", "sym"]).error, "symAtStart");
test("x and y both 0 is rejected", typeKeys(["run", 0, 0]).error, "zeroZero");
test("count 0 is rejected", typeKeys(["run", 1, 1, 0]).error, "countMin");
test("a digit after n is rejected", typeKeys(["run", 1, 1, "n", 2]).error, "countDone");
test("; before a move is finished is rejected", typeKeys(["run", 1, ";"]).error, "finishBeforeNext");

// --- keypad with a selection or the caret inside: plain replace / insert ---------
test("a selected digit is replaced", applyKey("run(1,1)n", 6, 7, 3), { value: "run(1,3)n", caret: 7 });
test("a selected word is replaced", applyKey("run(1,1)n", 0, 3, "jump"), { value: "jump(1,1)n", caret: 4 });
test("a digit is inserted at the caret", applyKey("run(1,1)", 4, 4, 5), { value: "run(51,1)", caret: 5 });
test("n replaces a selected count", applyKey("run(1,1)3", 8, 9, "n"), { value: "run(1,1)n", caret: 9 });
test("hand-typed text that fits no step is just inserted", applyKey("ru", 2, 2, 5), { value: "ru5", caret: 3 });

// --- del removes whole parts -------------------------------------------------------
{
  let value = "run(1,1)n";
  const steps: string[] = [];
  for (let i = 0; i < 5; i++) {
    value = deleteToken(value, value.length, value.length).value;
    steps.push(value);
  }
  test("del step by step from the end", steps, ["run(1,1)", "run(1,", "run(", "", ""]);
}
test("del after the word jump removes the whole word", deleteToken("sym(jump(2,1))", 8, 8), { value: "sym((2,1))", caret: 4 });
test("del after jump( removes it as one part", deleteToken("sym(jump(2,1))", 9, 9), { value: "sym(2,1))", caret: 4 });
test("del removes a whole number", deleteToken("run(1,1)12", 10, 10), { value: "run(1,1)", caret: 8 });
test("del removes an empty sym( pair completely", deleteToken("sym()", 4, 4), { value: "", caret: 0 });
test("del removes a selection", deleteToken("run(1,1)n", 4, 7), { value: "run()n", caret: 4 });
test("del at the start does nothing", deleteToken("run(1,1)", 0, 0), { value: "run(1,1)", caret: 0 });
test("del removes a single ;", deleteToken("run(1,1);", 9, 9), { value: "run(1,1)", caret: 8 });

// --- double-click selects one part -------------------------------------------------
{
  const text = "run(1,1)n;jump(2,-3)12";
  const partAt = (index: number) => {
    const range = tokenAt(text, index);
    return range && text.slice(range.start, range.end);
  };
  test("double-click on a word", partAt(text.indexOf("jump") + 2), "jump");
  test("double-click on the first number of 2,-3", partAt(text.indexOf("jump(2") + 5), "2");
  test("a caret right after a number still picks it", partAt(text.indexOf("jump(2") + 6), "2");
  test("a negative number is one part", partAt(text.indexOf("-3") + 1), "-3");
  test("a multi-digit count is one part", partAt(text.length - 1), "12");
  test("the n of a count", partAt(text.indexOf(")n") + 1), "n");
  test("a caret right before ; still picks the n in front of it", partAt(text.indexOf(";")), "n");
  test("between two punctuation marks nothing is picked", tokenAt("run(1,1);;", 9), null);
}

// --- reading the text --------------------------------------------------------------
test("empty text is no moves", parseNotation(""), { moves: [] });
test("two moves", parseNotation("run(1,1)n;jump(2,1)"), {
  moves: [
    { kind: "run", x: 1, y: 1, count: "n" },
    { kind: "jump", x: 2, y: 1 },
  ],
});
test("sym with a count", parseNotation("sym(jump(2,1)3)"), {
  moves: [{ kind: "jump", x: 2, y: 1, count: 3, modifier: "sym" }],
});
const countOf = (text: string) => {
  const parsed = parseNotation(text);
  return "moves" in parsed ? parsed.moves.length : parsed;
};
test("a missing closing parenthesis of sym is accepted", countOf("sym(jump(2,1)"), 1);
test("spaces and a trailing ; are fine", countOf(" run( 1 , 1 ) n ; "), 1);
test("negative numbers", parseNotation("jump(-2,1)"), { moves: [{ kind: "jump", x: -2, y: 1 }] });
test("missing y is a syntax error", parseNotation("run(1)"), { error: "syntax", segment: "run(1)" });
test("unknown kind is a syntax error", parseNotation("walk(1,1)"), { error: "syntax", segment: "walk(1,1)" });
test("a stray closing parenthesis is a syntax error", parseNotation("jump(1,1))"), { error: "syntax", segment: "jump(1,1))" });
test("unfinished move is a syntax error", parseNotation("run(1,"), { error: "syntax", segment: "run(1," });
test("(0,0) is rejected", parseNotation("run(0,0)n"), { error: "zeroZero" });
test("count 0 is rejected", parseNotation("run(1,1)0"), { error: "countMin" });

// --- round trip --------------------------------------------------------------------
for (const text of ["run(1,1)n", "run(1,0)n;run(-1,0)n;run(0,1)n", "sym(jump(2,1));run(1,1)3", "sym(run(1,0)n)"]) {
  const parsed = parseNotation(text);
  test(`round trip ${text}`, "moves" in parsed ? formatMoves(parsed.moves) : parsed, text);
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
