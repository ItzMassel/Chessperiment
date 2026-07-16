"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Board from "./Board";
import { ArrowLeft, RefreshCcw } from "lucide-react";

/* =======================
   Types – Custom Board
======================= */

export interface Coord {
    col: number; // 0 .. cols-1
    row: number; // 0 .. rows-1
}

export type PieceType =
    | "pawn"
    | "rook"
    | "knight"
    | "bishop"
    | "queen"
    | "king"
    | string; // allows custom pieces

export type Color = "white" | "black" | string;

export interface PlacedPiece {
    type: PieceType;
    color: Color;
}

// key format: "col,row" (e.g. "3,5")
export type PlacedPieces = Record<string, PlacedPiece>;

export interface CustomBoard {
    cols: number;
    rows: number;
    gridType: 'square' | 'hex';
    activeSquares: Coord[];
    placedPieces: PlacedPieces;
}

/* =======================
   Component
 ======================= */

export default function PlayPage() {
    const router = useRouter();
    const t = useTranslations("Editor.Board.Play");

    const [board, setBoard] = useState<CustomBoard | null>(null);

    useEffect(() => {
        const rawCols = localStorage.getItem("cols");
        const rawRows = localStorage.getItem("rows");
        const gridType = (localStorage.getItem("gridType") as 'square' | 'hex') || "square";

        const cols = parseInt(rawCols || "8", 10);
        const rows = parseInt(rawRows || "8", 10);
        const activeSquaresRaw = JSON.parse(localStorage.getItem("activeSquares") ?? "[]");
        const activeSquares: Coord[] = activeSquaresRaw.map((s: string) => {
            const [col, row] = s.split(',').map(Number);
            return { col, row };
        });
        const placedPieces = JSON.parse(localStorage.getItem("placedPieces") ?? "{}");
        setBoard({ cols, rows, gridType, activeSquares, placedPieces });
    }, []);

    if (!board) {
        return <div>{t('loading')}</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Board
                board={board}
                headerContent={
                    <div className="flex justify-between items-center mb-6 w-full">
                        <button
                            onClick={() => {
                                // Clear move history when going back to editor
                                localStorage.removeItem('engine_state');
                                router.push('/editor/board');
                            }}
                            className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">{t('title')}</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('engine_state');
                                    window.location.reload();
                                }}
                                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2 text-sm font-bold"
                            >
                                Reset
                            </button>
                            <button onClick={() => window.location.reload()} className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                <RefreshCcw size={20} />
                            </button>
                        </div>
                    </div>
                }
            />
        </div>
    );
}
