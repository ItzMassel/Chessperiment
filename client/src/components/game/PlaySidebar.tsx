import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Info, RotateCcw, Monitor, Check, Swords, Trophy, User } from 'lucide-react';
import { getPieceImage } from '@/lib/gameData'; // Use existing helper
import { Piece } from '@/engine/piece';

interface PlaySidebarProps {
    myColor: "white" | "black";
    gameStatus: string;
    gameInfo: string;
    moveHistory: { from: string; to: string; notation?: string }[];
    historyIndex: number;
    navigateHistory: (direction: "prev" | "next" | "start" | "end") => void;
    exitHistoryView: () => void;
    isViewingHistory: boolean;
    onResign: () => void;
    onOfferDraw: () => void; // Maybe unused in local
    onReset: () => void;
    gameMode: "local" | "computer";
    currentTurn: 'white' | 'black';
    onMoveClick: (index: number) => void;
    capturedByWhite: string[];
    capturedByBlack: string[];
    boardPieces: Piece[];
    selectedPiece: Piece | null;
}

export default function PlaySidebar({
    myColor, gameStatus, gameInfo,
    moveHistory = [], historyIndex, navigateHistory, exitHistoryView, isViewingHistory,
    onResign, onOfferDraw, onReset,
    gameMode,
    currentTurn,
    onMoveClick,
    capturedByWhite,
    capturedByBlack,
    selectedPiece
}: PlaySidebarProps) {
    const t = useTranslations('Multiplayer');
    const [activeTab, setActiveTab] = useState("moves");
    const [copied, setCopied] = useState(false);

    // Simplistic material calculation for visual display
    // Uses generic values or count
    const materialStats = useMemo(() => {
        // Values for standard pieces, 1 for custom as default
        const values: Record<string, number> = { 'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 0 };

        let whiteScore = 0;
        let blackScore = 0;

        capturedByWhite.forEach(type => {
            whiteScore += (values[type.toLowerCase()] || 1);
        });
        capturedByBlack.forEach(type => {
            blackScore += (values[type.toLowerCase()] || 1);
        });

        // capturedByWhite are Black pieces captured BY White
        // capturedByBlack are White pieces captured BY Black
        return {
            whiteScore, // Value of pieces White has captured
            blackScore, // Value of pieces Black has captured
            diff: whiteScore - blackScore
        };
    }, [capturedByWhite, capturedByBlack]);

    const renderMaterialInfo = (playerColor: 'white' | 'black') => {
        const isWhite = playerColor === 'white';
        // If I am White, I show what I captured (Black pieces)
        // capturedByWhite = Black pieces captured by White
        const captured = isWhite ? capturedByWhite : capturedByBlack;
        const capturedColor = isWhite ? 'black' : 'white';

        // Score logic: 
        // White adv = (Value captured by White) - (Value captured by Black)
        // Actually normally material is (Pieces on board), but here we calculate based on captures
        const netScore = isWhite ? (materialStats.whiteScore - materialStats.blackScore) : (materialStats.blackScore - materialStats.whiteScore);

        return (
            <div className="flex flex-col items-end gap-1">
                {netScore > 0 && (
                    <div className="bg-stone-100 dark:bg-white/10 px-2 py-0.5 rounded-md text-[10px] font-black text-green-600 dark:text-green-400 tabular-nums">
                        +{netScore}
                    </div>
                )}
                <div className="flex flex-wrap justify-end gap-1 max-w-[120px]">
                    {captured.map((type, idx) => (
                        <div key={idx} className="relative w-5 h-5 opacity-90 hover:opacity-100 transition-all hover:scale-110 flex items-center justify-center bg-stone-200/30 dark:bg-white/5 rounded-md border border-stone-200/50 dark:border-white/5 shadow-xs">
                            <div className="relative w-4 h-4">
                                <Image
                                    src={getPieceImage("v3", capturedColor, type)}
                                    alt={type}
                                    fill
                                    sizes="16px"
                                    className={`object-contain ${capturedColor === 'black' ? 'dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.8)]' : ''}`}
                                    unoptimized
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-[40vh] lg:h-full w-full lg:w-[420px] flex flex-col bg-stone-50/50 dark:bg-stone-900/90 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-white/10 backdrop-blur-2xl shadow-2xl z-40 transition-colors duration-300">
            <Tabs defaultValue="moves" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="px-4 lg:px-6 pt-4 lg:pt-6 pb-2 lg:pb-4 border-b border-stone-200 dark:border-white/5 bg-white/30 dark:bg-black/10">
                    <TabsList className="grid w-full grid-cols-2 bg-stone-200/50 dark:bg-white/5 p-1 rounded-2xl border border-stone-300 dark:border-white/10">
                        <TabsTrigger value="info" className="rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-stone-800 data-[state=active]:shadow-lg dark:data-[state=active]:text-amber-400 text-xs lg:text-sm">
                            <Info size={14} className="mr-1 lg:mr-2" />
                            <span className="hidden xs:inline">{t('GameSidebar.info')}</span>
                            <span className="xs:hidden italic text-[10px]">Info</span>
                        </TabsTrigger>
                        <TabsTrigger value="moves" className="rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-stone-800 data-[state=active]:shadow-lg dark:data-[state=active]:text-amber-400 text-xs lg:text-sm">
                            <History size={14} className="mr-1 lg:mr-2" />
                            <span className="hidden xs:inline">{t('GameSidebar.moves')}</span>
                            <span className="xs:hidden italic text-[10px]">Moves</span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="moves" className="flex-1 p-0 m-0 overflow-hidden flex flex-col items-stretch">
                    <ScrollArea className="flex-1 px-4 lg:px-6 py-2 lg:py-4">
                        <div className="flex flex-col gap-y-0.5">
                            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                                <div key={i} className="flex items-center group transition-colors hover:bg-stone-200/30 dark:hover:bg-white/5 rounded-xl p-1 px-2">
                                    <div className="w-8 text-stone-400 dark:text-stone-500 text-xs font-black tabular-nums">{i + 1}.</div>
                                    <div className="flex-1 flex gap-2">
                                        <button
                                            onClick={() => onMoveClick(i * 2)}
                                            className={`flex-1 text-left px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${historyIndex === (i * 2) && isViewingHistory
                                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105 z-10'
                                                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            {moveHistory[i * 2].notation || `${moveHistory[i * 2].from} → ${moveHistory[i * 2].to}`}
                                        </button>
                                        {moveHistory[i * 2 + 1] && (
                                            <button
                                                onClick={() => onMoveClick(i * 2 + 1)}
                                                className={`flex-1 text-left px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${historyIndex === (i * 2 + 1) && isViewingHistory
                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105 z-10'
                                                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                {moveHistory[i * 2 + 1].notation || `${moveHistory[i * 2 + 1].from} → ${moveHistory[i * 2 + 1].to}`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-3 lg:p-6 border-t border-stone-200 dark:border-white/5 bg-white/20 dark:bg-black/20">
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => navigateHistory('start')} className="p-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all disabled:opacity-30 border border-transparent hover:border-stone-200 dark:hover:border-white/10 shadow-sm" disabled={historyIndex < 0}>|&lt;</button>
                            <button onClick={() => navigateHistory('prev')} className="p-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all disabled:opacity-30 border border-transparent hover:border-stone-200 dark:hover:border-white/10 shadow-sm" disabled={historyIndex < 0}>&lt;</button>
                            <button onClick={exitHistoryView} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isViewingHistory ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-stone-200 dark:bg-white/5 text-stone-400 dark:text-stone-600'}`}>{t('live')}</button>
                            <button onClick={() => navigateHistory('next')} className="p-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all disabled:opacity-30 border border-transparent hover:border-stone-200 dark:hover:border-white/10 shadow-sm" disabled={!isViewingHistory}>&gt;</button>
                            <button onClick={() => navigateHistory('end')} className="p-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all disabled:opacity-30 border border-transparent hover:border-stone-200 dark:hover:border-white/10 shadow-sm" disabled={!isViewingHistory}>&gt;|</button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="info" className="flex-1 p-6 space-y-6 overflow-y-auto bg-white/10 dark:bg-transparent">
                    {/* Game Status Card */}
                    <div className="bg-linear-to-br from-amber-500 via-orange-500 to-amber-600 p-px rounded-3xl shadow-xl shadow-amber-500/10">
                        <div className="bg-white dark:bg-stone-900 p-6 rounded-[23px] space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">{t('GameSidebar.gameStatus')}</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${gameStatus === 'playing' ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-stone-300 dark:bg-stone-700'}`} />
                                    <span className="font-black text-xl text-stone-900 dark:text-white uppercase tracking-tight">{gameStatus}</span>
                                </div>
                            </div>
                            {gameInfo && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/30">
                                    <Trophy size={14} /> {gameInfo}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Piece Inspector */}
                    {selectedPiece ? (
                        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-xl border border-stone-200 dark:border-stone-800 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-4">Inspector</h3>
                            <div className="flex items-center gap-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl mb-4">
                                <div className="relative w-12 h-12">
                                    <Image
                                        src={getPieceImage("v3", selectedPiece.color, selectedPiece.type)}
                                        alt={selectedPiece.type}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-sm tracking-tight text-stone-900 dark:text-white">{selectedPiece.name || selectedPiece.type}</h3>
                                    <p className="text-xs text-stone-500 font-bold uppercase">{selectedPiece.position} • {selectedPiece.color}</p>
                                </div>
                            </div>

                            {(selectedPiece as any).isCustom && (selectedPiece as any).variables && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Variables</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries((selectedPiece as any).variables || {}).map(([key, val]) => (
                                            <div key={key} className="p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 rounded-lg">
                                                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase truncate">{key}</p>
                                                <p className="text-sm font-black text-amber-900 dark:text-amber-200 truncate">{String(val)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {Object.keys((selectedPiece as any).variables || {}).length === 0 && (
                                        <p className="text-xs text-stone-400 italic">No variables defined.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 rounded-3xl border border-dashed border-stone-200 dark:border-white/10 flex flex-col items-center justify-center text-stone-400 gap-2 min-h-[150px]">
                            <Info size={24} className="opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">Select a piece to inspect</p>
                        </div>
                    )}

                    {/* Match Details */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 px-2">{t('matchDetails')}</h3>

                        {/* Opponent Info (Always Black in Local for now) */}
                        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${currentTurn === 'black' ? 'bg-white dark:bg-stone-800 border-amber-500/50 shadow-lg scale-[1.02]' : 'bg-stone-50/50 dark:bg-white/5 border-stone-100 dark:border-white/5'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-white text-stone-900 border`}>
                                    ♚
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-sm uppercase tracking-tight text-stone-900 dark:text-white italic">
                                        Black
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${currentTurn === 'black' ? 'bg-green-500 animate-pulse shadow-sm shadow-green-500/50' : 'bg-stone-300 dark:bg-stone-700'}`} />
                                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest leading-none">
                                            {currentTurn === 'black' ? 'Thinking' : 'Waiting'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {renderMaterialInfo('black')}
                        </div>

                        {/* Player Info (You, White) */}
                        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${currentTurn === 'white' ? 'bg-white dark:bg-stone-800 border-amber-500/50 shadow-lg scale-[1.02]' : 'bg-stone-50/50 dark:bg-white/5 border-stone-100 dark:border-white/5'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner bg-stone-900 text-white border border-stone-800`}>
                                    ♔
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-sm uppercase tracking-tight text-stone-900 dark:text-white italic">
                                        White
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${currentTurn === 'white' ? 'bg-green-500 animate-pulse shadow-sm shadow-green-500/50' : 'bg-stone-300 dark:bg-stone-700'}`} />
                                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest leading-none">
                                            {currentTurn === 'white' ? 'Your Turn' : 'Waiting'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {renderMaterialInfo('white')}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Global Actions */}
            <div className="p-6 border-t border-stone-200 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onReset} className="col-span-2 py-4 px-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:shadow-xl flex items-center justify-center overflow-hidden">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        <span className="relative z-10">Reset Game</span>
                    </button>

                </div>
            </div>
        </div >
    );
}
