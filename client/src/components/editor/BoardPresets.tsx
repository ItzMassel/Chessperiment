"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import { LayoutTemplate, Grid3x3, Square, Maximize } from 'lucide-react';

interface BoardPresetsProps {
    onSelectPreset: (preset: { rows: number, cols: number, activeSquares: string[], placedPieces: Record<string, any> }) => void;
}

export default function BoardPresets({ onSelectPreset }: BoardPresetsProps) {
    const t = useTranslations('Editor.Board');

    const getStandardPieces = () => {
        const pieces: Record<string, { type: string, color: string }> = {};
        const backRow = ['Rook', 'Knight', 'Bishop', 'Queen', 'King', 'Bishop', 'Knight', 'Rook'];

        // Black pieces (Top, y=0,1)
        backRow.forEach((type, x) => {
            pieces[`${x},0`] = { type, color: 'black' };
            pieces[`${x},1`] = { type: 'Pawn', color: 'black' };
        });

        // White pieces (Bottom, y=7,6)
        backRow.forEach((type, x) => {
            pieces[`${x},7`] = { type, color: 'white' };
            pieces[`${x},6`] = { type: 'Pawn', color: 'white' };
        });
        return pieces;
    };

    const getActiveSquares = (rows: number, cols: number) => {
        const squares: string[] = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                squares.push(`${x},${y}`);
            }
        }
        return squares;
    };

    const presets = [
        {
            name: t('standardBoard'),
            icon: <LayoutTemplate size={18} />,
            data: { rows: 8, cols: 8, activeSquares: getActiveSquares(8, 8), placedPieces: getStandardPieces() }
        },
        {
            name: t('emptyBoard'),
            icon: <Square size={18} />,
            data: { rows: 8, cols: 8, activeSquares: getActiveSquares(8, 8), placedPieces: {} }
        },
        {
            name: t('smallBoard'),
            icon: <Grid3x3 size={18} />,
            data: { rows: 5, cols: 5, activeSquares: getActiveSquares(5, 5), placedPieces: {} }
        },
        {
            name: t('largeBoard'),
            icon: <Maximize size={18} />,
            data: { rows: 10, cols: 10, activeSquares: getActiveSquares(10, 10), placedPieces: {} }
        }
    ];

    return (
        <div className="mb-8 border-t border-gray-200/20 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 opacity-80">{t('presets')}</h3>
            <div className="grid grid-cols-2 gap-2">
                {presets.map((preset, index) => (
                    <button
                        key={index}
                        onClick={() => onSelectPreset(preset.data)}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-bg/20 border border-gray-200/10 hover:border-accent/40 hover:bg-accent/5 transition-all gap-2 text-center group"
                    >
                        <div className="text-gray-400 group-hover:text-accent transition-colors">{preset.icon}</div>
                        <span className="text-xs font-medium opacity-80 group-hover:opacity-100">{preset.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
