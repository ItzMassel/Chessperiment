"use client"
import { object_to_notation } from "@/lib/notations"
import { useState, useEffect, useRef, type JSX } from "react"

type Move = {modifier?:"sym",kind?:string,x?:number,y?:number,count?:number | "n"}

// Pieces saved before the notation existed hold old condition-based rules in the same moves[].
// They are not editable here, but they are kept untouched when saving.
const isNotationMove = (m: any): m is Move => !!m && typeof m.kind === "string"

export default function MoveNotationPage({ moves: savedMoves, onUpdate }: { moves: any[], onUpdate: (moves: any[]) => void }) {
    const legacyMoves = (savedMoves ?? []).filter(m => !isNotationMove(m))
    const [moves, setMoves] = useState<Move[]>(() => (savedMoves ?? []).filter(isNotationMove))
    const [text, setText] = useState<Move>({})
    const [nextInput, setNextInput] = useState<"kind" | "x" | "y" | "count">("kind")
    const [feedback, setFeedback] = useState<string>()

    // The editor loads a piece's moves after this component mounts. Resync whenever they change
    // from outside, otherwise saving would overwrite them with an empty list.
    const lastSent = useRef<any[] | null>(null)
    useEffect(() => {
        if (savedMoves === lastSent.current) return
        setMoves((savedMoves ?? []).filter(isNotationMove))
        setText({})
        setNextInput("kind")
    }, [savedMoves])

    const handlePressedButton = (label:any) => {
        setFeedback(undefined)
        if (typeof label === "number") {
            if (nextInput === "kind") {
                setFeedback("Start by choosing run / jump")
            }
            else if (nextInput === "x") {
                setText(prev => ({ ...prev, x: label }))
                setNextInput("y")
            }
            else if (nextInput === "y") {
                setText(prev => ({ ...prev, y: label }))
                setNextInput("count")
            }
            else if (nextInput === "count") {
                setText(prev => ({ ...prev, count: label }))
                setNextInput("kind")
            }
        }
        else if (label === "run" || label === "jump"){
            if(nextInput === "kind") {
                // Keep a modifier chosen for this move; start fresh after a completed move
                setText(prev => prev.x === undefined ? { ...prev, kind: label } : { kind: label })
                setNextInput("x")
            }
            else setFeedback("Enter a numeral value")
        }
        else if (label === "n") {
            if (nextInput === "count") {
                setText(prev => ({ ...prev, count: "n" }))
                setNextInput("kind")
            }
            else setFeedback("n can only be used as the count")
        }
        else if (label === "sym") {
            if (nextInput === "kind") setText(prev => ({ ...prev, modifier:"sym" }))
            else setFeedback("Sym belongs to the very start of the notation.")
            
        }
        else if (label === "del") {
            setFeedback(undefined)
            if (text.count !== undefined) {
                setText(({ count, ...rest }) => rest)
                setNextInput("count")
            }
            else if (text.y !== undefined) {
                setText(({ y, ...rest }) => rest)
                setNextInput("y")
            }
            else if (text.x !== undefined) {
                setText(({ x, ...rest }) => rest)
                setNextInput("x")
            }
            else if (text.kind !== undefined) {
                setText(({ kind, ...rest }) => rest)
                setNextInput("kind")
            }
            else if (text.modifier !== undefined) {
                setText(({ modifier, ...rest }) => rest)
            }
            else if (moves.length > 0) {
                // Nothing left in the current move: remove the ";" and reopen the previous move
                setText(moves[moves.length - 1])
                setMoves(prev => prev.slice(0, -1))
                setNextInput("count")
            }
        }
        else if (label === ";") {
            if (text.kind === undefined || text.x === undefined || text.y === undefined) {
                setFeedback("Finish the current move before starting a new one")
            }
            else {
                setFeedback(undefined)
                setMoves(prev => [...prev, text])
                setText({})
                setNextInput("kind")
            }
        }
        else if (label === "enter") {
            const started = Object.keys(text).length > 0
            const complete = text.kind !== undefined && text.x !== undefined && text.y !== undefined
            if (started && !complete) {
                setFeedback("Finish the current move before saving")
                return
            }
            const finished = started ? [...moves, text] : moves
            setMoves(finished)
            setText({})
            setNextInput("kind")
            const toSave = [...legacyMoves, ...finished]
            lastSent.current = toSave
            onUpdate(toSave)
            setFeedback("Saved")
        }
        else {
            setFeedback("Unexpected input: " + label)
        }
    }
    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 p-4">
            <div>
                <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Move Notation</h2>
                <p className="text-stone-500 dark:text-white/40 text-sm">
                    Build a move with the keypad: kind, then x, y and count.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                <Keyboard handlePressedButton={handlePressedButton} />

                <div className="flex-1 w-full space-y-4">
                    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                        <p className="text-xs text-stone-500 dark:text-white/40 uppercase tracking-widest font-bold mb-3">
                            Current move
                        </p>
                        <p className="font-mono text-sm text-stone-900 dark:text-white whitespace-pre-wrap break-all">
                            {[...moves, ...(Object.keys(text).length ? [text] : [])].map(object_to_notation).join(";")}
                        </p>
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
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n): Tile => ({ id: `number-${n}`, label: n })),
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
  return (
    <div
      aria-label="Interactive command keypad"
      className="grid grid-cols-3 gap-3 w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-3xl p-6 shadow-xl"
    >
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          onClick={() => handlePressedButton(tile.label)}
          className={`${tile.wide ? "col-span-2" : ""} ${variantClass[tile.variant ?? "number"]} h-20 rounded-2xl text-2xl font-black transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
        >
          {tile.label}
        </button>
      ))}
    </div>
  );
};
