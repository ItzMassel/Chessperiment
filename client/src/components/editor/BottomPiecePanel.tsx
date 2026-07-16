'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/types/Project';
import { useTranslations } from 'next-intl';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { getPieceImage } from '@/lib/gameData';
import PieceRenderer from '@/components/game/PieceRenderer';

interface BottomPiecePanelProps {
    project: Project;
    onSelectPiece?: (piece: { type: string, color: string, movement?: 'run' | 'jump' }) => void;
    selectedPiece?: { type: string, color: string, movement?: 'run' | 'jump' } | null;
}

const standardPieces = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

export default function BottomPiecePanel({ project, onSelectPiece, selectedPiece }: BottomPiecePanelProps) {
    const t = useTranslations('BottomPiecePanel');
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedColor, setSelectedColor] = useState<'white' | 'black'>('white');
    const [pieceMovements, setPieceMovements] = useState<Record<string, 'run' | 'jump'>>({});
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, piece: string } | null>(null);

    // Close context menu on click elsewhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const collapsedHeight = 20; // px
    const expandedHeight = typeof window !== 'undefined' ? window.innerHeight / 3 : 300;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 transition-all duration-300 z-30 shadow-lg"
            style={{ height: isExpanded ? `${expandedHeight}px` : `${collapsedHeight}px` }}
            onClick={(e) => {
                // If clicking the background of the panel, deselect
                if (e.target === e.currentTarget) {
                    onSelectPiece?.({ type: '', color: '' });
                }
            }}
        >
            {/* Collapse/Expand Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-300 dark:bg-gray-700 rounded-full p-2 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors shadow-md"
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                ) : (
                    <ChevronUp className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                )}
            </button>

            {isExpanded && (
                <div className="h-full overflow-y-auto p-4" onClick={(e) => {
                    if (e.target === e.currentTarget) onSelectPiece?.({ type: '', color: '' });
                }}>
                    {/* Color Toggle */}
                    <div className="flex gap-2 mb-4 justify-center">
                        <button
                            onClick={() => setSelectedColor('white')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedColor === 'white'
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-600'
                                }`}
                        >
                            {t('white')}
                        </button>
                        <button
                            onClick={() => setSelectedColor('black')}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedColor === 'black'
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-400 dark:hover:bg-gray-600'
                                }`}
                        >
                            {t('black')}
                        </button>
                    </div>

                    {/* Standard Pieces */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                            {t('standardPieces')}
                        </h3>
                        <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
                            {standardPieces.map((piece) => {
                                const currentMovement = pieceMovements[piece] || (['Knight'].includes(piece) ? 'jump' : 'run');
                                const isSelected = selectedPiece?.type === piece && selectedPiece?.color === selectedColor;

                                return (
                                    <button
                                        key={piece}
                                        onClick={() => onSelectPiece?.({ type: piece, color: selectedColor, movement: currentMovement })}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            // Calculate position relative to viewport
                                            setContextMenu({ x: e.clientX, y: e.clientY, piece });
                                        }}
                                        className={`aspect-square rounded-lg p-2 transition-all border-2 flex items-center justify-center relative ${isSelected ? 'bg-accent/10 border-accent shadow-inner scale-95' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-105'} `}
                                        draggable
                                        onDragStart={(e) => {
                                            onSelectPiece?.({ type: piece, color: selectedColor, movement: currentMovement });
                                            e.dataTransfer.setData('piece', JSON.stringify({ type: piece, color: selectedColor, movement: currentMovement }));
                                            // Optional: set a smaller drag image? Standard HTML5 drag image is a bit limited.
                                        }}
                                    >
                                        <div className="w-full h-full relative pointer-events-none">
                                            <Image
                                                src={getPieceImage('modern', selectedColor, piece)}
                                                alt={piece}
                                                fill
                                                unoptimized
                                                className="object-contain"
                                            />
                                            {/* Status Indicator Badge */}
                                            <div className={`absolute -bottom-1 -right-1 text-[8px] px-1 rounded-full font-bold uppercase tracking-tighter ${currentMovement === 'jump' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                                                }`}>
                                                {currentMovement === 'jump' ? 'JUMP' : 'RUN'}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Context Menu */}
                    {contextMenu && (
                        <div
                            className="fixed z-50 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[120px]"
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-stone-900/50">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {contextMenu.piece} Movement
                                </span>
                            </div>
                            <div className="p-1">
                                <button
                                    onClick={() => {
                                        setPieceMovements(prev => ({ ...prev, [contextMenu.piece]: 'jump' }));
                                        setContextMenu(null);
                                        // Update selection if this piece is selected
                                        if (selectedPiece?.type === contextMenu.piece) {
                                            onSelectPiece?.({ type: contextMenu.piece, color: selectedColor, movement: 'jump' });
                                        }
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${pieceMovements[contextMenu.piece] === 'jump' || (!pieceMovements[contextMenu.piece] && contextMenu.piece === 'Knight')
                                        ? 'bg-accent/10 text-accent font-medium'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <span>Jump</span>
                                    {(pieceMovements[contextMenu.piece] === 'jump' || (!pieceMovements[contextMenu.piece] && contextMenu.piece === 'Knight')) && (
                                        <span className="w-2 h-2 rounded-full bg-accent ml-2" />
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setPieceMovements(prev => ({ ...prev, [contextMenu.piece]: 'run' }));
                                        setContextMenu(null);
                                        // Update selection if this piece is selected
                                        if (selectedPiece?.type === contextMenu.piece) {
                                            onSelectPiece?.({ type: contextMenu.piece, color: selectedColor, movement: 'run' });
                                        }
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${pieceMovements[contextMenu.piece] === 'run' || (!pieceMovements[contextMenu.piece] && contextMenu.piece !== 'Knight')
                                        ? 'bg-accent/10 text-accent font-medium'
                                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <span>Run</span>
                                    {(pieceMovements[contextMenu.piece] === 'run' || (!pieceMovements[contextMenu.piece] && contextMenu.piece !== 'Knight')) && (
                                        <span className="w-2 h-2 rounded-full bg-accent ml-2" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Custom Pieces */}
                    {project.customPieces.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                                {t('customPieces')}
                            </h3>
                            <div className="grid grid-cols-6 md:grid-cols-12 gap-3">
                                {project.customPieces.map((piece, index) => {
                                    const pieceId = piece.id || piece.name;
                                    const isSelected = selectedPiece?.type === pieceId && selectedPiece?.color === selectedColor;
                                    return (
                                        <button
                                            key={pieceId}
                                            onClick={() => onSelectPiece?.({ type: pieceId, color: selectedColor })}
                                            className={`aspect-square rounded-lg p-2 transition-all border-2 flex flex-col items-center justify-center ${isSelected ? 'bg-accent/10 border-accent shadow-inner scale-95' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-105'} `}
                                            draggable
                                            onDragStart={(e) => {
                                                onSelectPiece?.({ type: pieceId, color: selectedColor });
                                                e.dataTransfer.setData('piece', JSON.stringify({ type: pieceId, color: selectedColor, custom: true }));
                                            }}
                                        >
                                            <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                                <PieceRenderer
                                                    type={piece.name}
                                                    color={selectedColor}
                                                    size={40}
                                                    pixels={selectedColor === 'white' ? piece.pixelsWhite : piece.pixelsBlack}
                                                />
                                            </div>
                                            <span className="text-[8px] text-gray-600 dark:text-gray-400 mt-1 truncate w-full text-center pointer-events-none">
                                                {piece.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
