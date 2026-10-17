"use client"
import { useState, useEffect, useLayoutEffect, useRef, type JSX } from "react"
import { useTranslations } from "next-intl"
import { isNotationMove } from "@/engine/vectorNotation"
import { applyKey, deleteToken, formatMoves, parseNotation, tokenAt } from "@/lib/notationEditor"

export default function MoveNotationPage({ moves: savedMoves, onUpdate }: { moves: any[], onUpdate: (moves: any[]) => void }) {
    const t = useTranslations("Editor.Piece.MoveNotation")
    // Pieces saved before the notation existed hold old condition-based rules in the same moves[].
    // They are not editable here, but they are kept untouched when saving.
    const legacyMoves = (savedMoves ?? []).filter(m => !isNotationMove(m))
    const notationOf = (moves: any[] | undefined) => formatMoves((moves ?? []).filter(isNotationMove))

    // The whole notation is one text, edited like any text field.
    const [value, setValue] = useState(() => notationOf(savedMoves))
    const [feedback, setFeedback] = useState<string>()
    const field = useRef<HTMLTextAreaElement>(null)
    const caretAfterRender = useRef<number | null>(null)
    const hasCaret = useRef(false)
    // Where the first click of a double-click put the caret
    const lastCaret = useRef(0)

    // The editor loads a piece's moves after this component mounts. Resync whenever they change
    // from outside, otherwise saving would overwrite them with an empty list.
    const lastSent = useRef<any[] | null>(null)
    useEffect(() => {
        if (savedMoves === lastSent.current) return
        setValue(notationOf(savedMoves))
        setFeedback(undefined)
    }, [savedMoves])

    // The new text only exists after rendering, so the caret is placed here.
    useLayoutEffect(() => {
        if (caretAfterRender.current === null) return
        field.current?.setSelectionRange(caretAfterRender.current, caretAfterRender.current)
        caretAfterRender.current = null
    })

    const edit = (next: { value: string; caret: number }) => {
        caretAfterRender.current = next.caret
        setValue(next.value)
        field.current?.focus()
    }

    // Until the field has been used, the keypad types at the end.
    const selection = () => {
        const el = field.current
        if (!el || !hasCaret.current) return { start: value.length, end: value.length }
        return { start: el.selectionStart, end: el.selectionEnd }
    }

    const save = () => {
        const parsed = parseNotation(value)
        if ("error" in parsed) {
            setFeedback(t(`feedback.${parsed.error}`, { segment: parsed.segment ?? "" }))
            return
        }
        const toSave = [...legacyMoves, ...parsed.moves]
        lastSent.current = toSave
        setValue(formatMoves(parsed.moves))
        onUpdate(toSave)
        setFeedback(t("feedback.saved"))
    }

    const handlePressedButton = (label: string | number) => {
        setFeedback(undefined)
        if (label === "enter") {
            save()
            return
        }
        const { start, end } = selection()
        if (label === "del") {
            edit(deleteToken(value, start, end))
            return
        }
        const result = applyKey(value, start, end, label)
        if ("error" in result) {
            setFeedback(t(`feedback.${result.error}`))
            return
        }
        edit(result)
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 p-4">
            <div>
                <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">{t("title")}</h2>
                <p className="text-stone-500 dark:text-white/40 text-sm">
                    {t("description")}
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <Keyboard handlePressedButton={handlePressedButton} />

                <div className="flex-1 w-full space-y-4">
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                        <label
                            htmlFor="move-notation-field"
                            className="block text-xs text-stone-500 dark:text-white/40 uppercase tracking-widest font-bold mb-3"
                        >
                            {t("currentMove")}
                        </label>
                        <textarea
                            id="move-notation-field"
                            ref={field}
                            value={value}
                            rows={4}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoCorrect="off"
                            inputMode="none"
                            placeholder="run(1,0)n;sym(jump(2,1))"
                            onFocus={() => { hasCaret.current = true }}
                            onSelect={(e) => {
                                const el = e.currentTarget
                                if (el.selectionStart === el.selectionEnd) lastCaret.current = el.selectionStart
                            }}
                            onDoubleClick={(e) => {
                                // Select one part (a word or a number), not "2,1" as the browser would
                                const range = tokenAt(value, lastCaret.current)
                                if (range) e.currentTarget.setSelectionRange(range.start, range.end)
                            }}
                            onChange={(e) => {
                                setValue(e.target.value)
                                setFeedback(undefined)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handlePressedButton("enter")
                                } else if (
                                    e.key === "Backspace" && !e.ctrlKey && !e.metaKey && !e.altKey &&
                                    e.currentTarget.selectionStart === e.currentTarget.selectionEnd
                                ) {
                                    // Removes a whole part like "jump(", not one letter
                                    e.preventDefault()
                                    handlePressedButton("del")
                                }
                            }}
                            className="w-full resize-none rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-200 dark:border-white/10 px-4 py-3 font-mono text-sm text-stone-900 dark:text-white placeholder:text-stone-300 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <p className="mt-3 text-xs text-stone-400 dark:text-white/30">{t("editHint")}</p>
                    </div>
                    {feedback && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 rounded-2xl px-6 py-4 text-sm font-bold">
                            {feedback}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

type Tile = {
  id: string;
  label: string | number;
  wide?: boolean;
  variant?: "number" | "command" | "enter";
};

const tiles: Tile[] = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n): Tile => ({ id: `number-${n}`, label: n })),
  { id: "command-run", label: "run", variant: "command" },
  { id: "command-jump", label: "jump", variant: "command" },
  { id: "command-sym", label: "sym", variant: "command" },
  { id: "command-n", label: "n", variant: "command" },
  { id: "command-semicolon", label: ";", variant: "command" },
  { id: "command-del", label: "del", variant: "command" },
  { id: "command-enter", label: "enter", variant: "enter", wide: true },
];

const variantClass = {
  number:
    "bg-stone-100 dark:bg-white/5 text-stone-900 dark:text-white border border-stone-200 dark:border-white/10 hover:bg-stone-200 dark:hover:bg-white/10",
  command:
    "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 hover:bg-amber-500/20",
  enter: "bg-amber-500 text-white dark:text-bg hover:bg-amber-400 shadow-lg shadow-amber-500/20",
};

export const Keyboard = ({ handlePressedButton }: { handlePressedButton: (label: string | number) => void }): JSX.Element => {
  const t = useTranslations("Editor.Piece.MoveNotation")
  // run / jump / sym / n / ; are notation tokens and stay untranslated; del and enter are key captions.
  const caption = (label: string | number) => (label === "del" || label === "enter" ? t(`keys.${label}`) : label)
  return (
    <div
      aria-label={t("keypadLabel")}
      className="grid grid-cols-3 gap-3 w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl p-6 shadow-xl"
    >
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          // Keeps the caret and the selection in the text field while a key is pressed
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handlePressedButton(tile.label)}
          className={`${tile.wide ? "col-span-2" : ""} ${variantClass[tile.variant ?? "number"]} h-20 rounded-2xl text-2xl font-black transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
        >
          {caption(tile.label)}
        </button>
      ))}
    </div>
  );
};
