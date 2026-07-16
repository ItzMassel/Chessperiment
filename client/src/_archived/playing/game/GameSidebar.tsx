"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, History, Info, Send, User, Monitor, Copy, Check, Share2, Swords, Trophy, Ghost, UserPlus } from 'lucide-react';
import { getPieceImage, PieceType } from "./Data";
import { useRouter } from "next/navigation";

interface GameSidebarProps {
    myColor: "white" | "black" | null;
    gameStatus: string;
    gameInfo: string;
    moveHistory: string[];
    historyIndex: number;
    navigateHistory: (direction: "prev" | "next" | "start" | "end") => void;
    exitHistoryView: () => void;
    isViewingHistory: boolean;
    chatMessages: string[];
    onSendMessage: (msg: string) => void;
    currentRoom: string;
    playerCount: number;
    onResign: () => void;
    onOfferDraw: () => void;
    onStartComputerGame: (elo: number) => void;
    gameMode: "online" | "computer" | "local";
    setGameMode: (mode: "online" | "computer" | "local") => void;
    currentTurn: 'w' | 'b';
    onLeaveGame: () => void;
    onMoveClick: (index: number) => void;
    boardPieces: PieceType[];
    onRematch?: () => void;
    onNextGame?: () => void;
    rematchRequested?: boolean;
    opponentRematchRequested?: boolean;
}

export default function GameSidebar({
    myColor, gameStatus, gameInfo,
    moveHistory = [], historyIndex, navigateHistory, exitHistoryView, isViewingHistory,
    chatMessages = [], onSendMessage,
    currentRoom, playerCount,
    onResign, onOfferDraw, onStartComputerGame,
    gameMode, setGameMode, onLeaveGame,
    currentTurn,
    onMoveClick,
    boardPieces = [],
    onRematch,
    onNextGame,
    rematchRequested,
    opponentRematchRequested
}: GameSidebarProps) {
    const t = useTranslations();
    const router = useRouter();
    const [msgInput, setMsgInput] = useState("");
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("moves");
    const [hasUnreadChat, setHasUnreadChat] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const materialStats = useMemo(() => {
        const values: Record<string, number> = { 'Pawn': 1, 'Knight': 3, 'Bishop': 3, 'Rook': 5, 'Queen': 9, 'King': 0 };
        const initialCounts: Record<string, number> = { 'Pawn': 8, 'Knight': 2, 'Bishop': 2, 'Rook': 2, 'Queen': 1, 'King': 1 };

        const currentWhite: Record<string, number> = { 'Pawn': 0, 'Knight': 0, 'Bishop': 0, 'Rook': 0, 'Queen': 0, 'King': 0 };
        const currentBlack: Record<string, number> = { 'Pawn': 0, 'Knight': 0, 'Bishop': 0, 'Rook': 0, 'Queen': 0, 'King': 0 };

        let whiteScore = 0;
        let blackScore = 0;

        boardPieces.forEach(p => {
            const type = p.type;
            const val = values[type] || 0;
            if (p.color === 'white') {
                currentWhite[type] = (currentWhite[type] || 0) + 1;
                whiteScore += val;
            } else {
                currentBlack[type] = (currentBlack[type] || 0) + 1;
                blackScore += val;
            }
        });

        // Calculate captured pieces (Initial - Current)
        // Captured BY White = Missing Black pieces
        const capturedByWhite: string[] = [];
        // Captured BY Black = Missing White pieces
        const capturedByBlack: string[] = [];

        Object.keys(initialCounts).forEach(type => {
            if (type === 'King') return;

            const whiteMissing = Math.max(0, initialCounts[type] - currentWhite[type]);
            for (let i = 0; i < whiteMissing; i++) capturedByBlack.push(type); // Black captured these white pieces

            const blackMissing = Math.max(0, initialCounts[type] - currentBlack[type]);
            for (let i = 0; i < blackMissing; i++) capturedByWhite.push(type); // White captured these black pieces
        });

        // Sort captured pieces by value for display
        const sortByValue = (a: string, b: string) => (values[b] || 0) - (values[a] || 0);
        capturedByWhite.sort(sortByValue);
        capturedByBlack.sort(sortByValue);

        return {
            whiteScore,
            blackScore,
            capturedByWhite, // Black pieces captured by White
            capturedByBlack, // White pieces captured by Black
            diff: whiteScore - blackScore
        };
    }, [boardPieces]);

    useEffect(() => {
        if (activeTab === "chat") setHasUnreadChat(false);
    }, [activeTab]);

    useEffect(() => {
        if (chatMessages.length > 0 && activeTab !== "chat") {
            setHasUnreadChat(true);
        }
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, activeTab]);

    const handleSend = () => {
        if (!msgInput.trim()) return;
        onSendMessage(msgInput);
        setMsgInput("");
    };

    const handleCopyRoom = async () => {
        if (!currentRoom) return;
        try {
            await navigator.clipboard.writeText(currentRoom);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShareRoom = async () => {
        if (!currentRoom) return;
        const shareData = {
            title: t('Multiplayer.joinMyGameTitle'),
            text: t('Multiplayer.joinMyGameText', { room: currentRoom }),
            url: `${window.location.origin}/game?room=${currentRoom}`
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.log('Share failed'); }
        } else {
            handleCopyRoom();
        }
    };

    const renderMaterialInfo = (playerColor: 'white' | 'black') => {
        const isWhite = playerColor === 'white';
        const captured = isWhite ? materialStats.capturedByWhite : materialStats.capturedByBlack; // Pieces this player HAS CAPTURED
        const scoreDiff = isWhite ? materialStats.diff : -materialStats.diff;
        const capturedColor = isWhite ? 'black' : 'white'; // The color of the pieces they captured

        return (
            <div className="flex flex-col items-end gap-1">
                {scoreDiff > 0 && (
                    <div className="bg-stone-100 dark:bg-white/10 px-2 py-0.5 rounded-md text-[10px] font-black text-green-600 dark:text-green-400 tabular-nums">
                        +{scoreDiff}
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
                    <TabsList className="grid w-full grid-cols-3 bg-stone-200/50 dark:bg-white/5 p-1 rounded-2xl border border-stone-300 dark:border-white/10">
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
                        <TabsTrigger value="chat" className="rounded-xl transition-all relative data-[state=active]:bg-white dark:data-[state=active]:bg-stone-800 data-[state=active]:shadow-lg dark:data-[state=active]:text-amber-400 text-xs lg:text-sm">
                            <MessageSquare size={14} className="mr-1 lg:mr-2" />
                            <span className="hidden xs:inline">{t('GameSidebar.chat')}</span>
                            <span className="xs:hidden italic text-[10px]">Chat</span>
                            {hasUnreadChat && <span className="absolute top-1 right-1 lg:right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-500/50" />}
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
                                            {moveHistory[i * 2]}
                                        </button>
                                        {moveHistory[i * 2 + 1] && (
                                            <button
                                                onClick={() => onMoveClick(i * 2 + 1)}
                                                className={`flex-1 text-left px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${historyIndex === (i * 2 + 1) && isViewingHistory
                                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105 z-10'
                                                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                {moveHistory[i * 2 + 1]}
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
                            <button onClick={exitHistoryView} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isViewingHistory ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-stone-200 dark:bg-white/5 text-stone-400 dark:text-stone-600'}`}>{t('Multiplayer.live')}</button>
                            <button onClick={() => navigateHistory('next')} className="p-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all disabled:opacity-30 border border-transparent hover:border-stone-200 dark:hover:border-white/10 shadow-sm" disabled={!isViewingHistory}>&gt;</button>
                            <button onClick={() => navigateHistory('end')} className="p-2.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-white/10 hover:text-amber-500 dark:hover:text-amber-400 transition-all disabled:opacity-30 border border-transparent hover:border-stone-200 dark:hover:border-white/10 shadow-sm" disabled={!isViewingHistory}>&gt;|</button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="chat" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 px-6 py-4">
                        <div className="space-y-4">
                            {chatMessages.length === 0 && (
                                <div className="text-center py-10">
                                    <Ghost size={40} className="mx-auto text-stone-300 dark:text-stone-700 mb-2" />
                                    <p className="text-xs text-stone-400 dark:text-stone-600 font-bold uppercase tracking-widest">No messages yet</p>
                                </div>
                            )}
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className="group flex flex-col animate-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-white dark:bg-stone-800/80 backdrop-blur-sm p-4 rounded-2xl border border-stone-100 dark:border-white/5 shadow-sm group-hover:shadow-md transition-shadow">
                                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed wrap-break-word">{msg}</p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    </ScrollArea>
                    <div className="p-6 border-t border-stone-200 dark:border-white/5 bg-white/10 dark:bg-black/10">
                        <div className="flex gap-2">
                            <input
                                value={msgInput}
                                onChange={(e) => setMsgInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={t('Multiplayer.typeMessage')}
                                className="flex-1 bg-white dark:bg-stone-800/50 border border-stone-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-amber-500/50 outline-none transition-all shadow-inner"
                            />
                            <button onClick={handleSend} className="p-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"><Send size={20} /></button>
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
                                    <span className="font-black text-xl text-stone-900 dark:text-white uppercase tracking-tight">{t('Multiplayer.' + (gameStatus || 'connecting'))}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-white/5 rounded-full border border-stone-200 dark:border-white/10">
                                    <User size={12} className="text-stone-400" />
                                    <span className="text-xs font-black tabular-nums">{playerCount}/2</span>
                                </div>
                            </div>
                            {gameInfo && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/30">
                                    <Trophy size={14} /> {gameInfo}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Room Code Card */}
                    <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-stone-200 dark:border-white/10 shadow-sm space-y-4">
                        <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">{t('GameSidebar.roomCode')}</p>
                        {currentRoom ? (
                            <div className="space-y-4">
                                <code className="block w-full bg-stone-100 dark:bg-black/40 px-6 py-4 rounded-2xl border border-stone-200 dark:border-white/10 font-mono text-xl sm:text-3xl font-black text-center tracking-[0.2em] text-amber-600 dark:text-amber-500 shadow-inner break-all">{currentRoom}</code>
                                <div className="flex gap-2">
                                    <button onClick={handleCopyRoom} className="flex-1 flex items-center justify-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg">{copied ? <><Check size={16} /> {t('Multiplayer.copied')}</> : <><Copy size={16} /> {t('Multiplayer.copy')}</>}</button>
                                    <button onClick={handleShareRoom} className="p-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all shadow-lg active:scale-[0.98]"><Share2 size={20} /></button>
                                </div>
                            </div>
                        ) : <div className="text-center py-4 text-stone-400 dark:text-stone-600 font-mono italic text-sm">{t('Multiplayer.noActiveRoom')}</div>}
                    </div>

                    {/* Match Details */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 px-2">{t('Multiplayer.matchDetails')}</h3>

                        {/* Opponent Info */}
                        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${currentTurn === (myColor === 'white' ? 'b' : 'w') ? 'bg-white dark:bg-stone-800 border-amber-500/50 shadow-lg scale-[1.02]' : 'bg-stone-50/50 dark:bg-white/5 border-stone-100 dark:border-white/5'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${myColor === 'black' ? 'bg-white text-stone-900 border' : 'bg-stone-900 text-white border border-stone-800'}`}>
                                    {myColor === 'black' ? '♔' : '♚'}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-sm uppercase tracking-tight text-stone-900 dark:text-white italic">
                                        {gameMode === 'computer' ? t('Multiplayer.stockfish') : (playerCount > 1 ? t('Multiplayer.opponent') : t('Multiplayer.waitingOpponent'))}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${currentTurn === (myColor === 'white' ? 'b' : 'w') ? 'bg-green-500 animate-pulse shadow-sm shadow-green-500/50' : 'bg-stone-300 dark:bg-stone-700'}`} />
                                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest leading-none">
                                            {t('Multiplayer.opponent')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Material Info for Opponent */}
                            {renderMaterialInfo(myColor === 'white' ? 'black' : 'white')}
                        </div>

                        {/* Player Info (You) */}
                        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${currentTurn === (myColor === 'white' ? 'w' : 'b') ? 'bg-white dark:bg-stone-800 border-amber-500/50 shadow-lg scale-[1.02]' : 'bg-stone-50/50 dark:bg-white/5 border-stone-100 dark:border-white/5'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${myColor === 'white' ? 'bg-white text-stone-900 border' : 'bg-stone-900 text-white border border-stone-800'}`}>
                                    {myColor === 'white' ? '♔' : '♚'}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-sm uppercase tracking-tight text-stone-900 dark:text-white italic">
                                        {t('Multiplayer.you')} ({myColor ? t('Multiplayer.' + myColor) : ""})
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${currentTurn === (myColor === 'white' ? 'w' : 'b') ? 'bg-green-500 animate-pulse shadow-sm shadow-green-500/50' : 'bg-stone-300 dark:bg-stone-700'}`} />
                                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-widest leading-none">
                                            {t('GameSidebar.yourSide')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Material Info for You */}
                            {myColor && renderMaterialInfo(myColor)}
                        </div>

                        <button onClick={onLeaveGame} className="w-full py-4 mt-4 bg-stone-200/50 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-stone-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-transparent hover:border-stone-200 dark:hover:border-white/20">
                            &lt; {t('Multiplayer.returnToLobby')}
                        </button>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Global Actions */}
            <div className="p-6 border-t border-stone-200 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onResign} disabled={gameStatus !== 'playing'} className="group relative py-4 px-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-red-600 active:scale-[0.98] disabled:opacity-30 flex items-center justify-center overflow-hidden">
                        <span className="relative z-10">{t('Multiplayer.resign')}</span>
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <button onClick={onOfferDraw} disabled={gameStatus !== 'playing' || gameMode === 'computer'} className="group relative py-4 px-4 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 border border-transparent hover:shadow-xl flex items-center justify-center overflow-hidden">
                        <span className="relative z-10">{t('Multiplayer.offerDraw')}</span>
                        <div className="absolute inset-0 bg-linear-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    {gameStatus === 'ended' && (
                        <>
                            <button
                                onClick={onRematch}
                                disabled={rematchRequested}
                                className={`col-span-1 shadow-lg py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center overflow-hidden border-2 ${opponentRematchRequested ? 'bg-amber-500 text-white border-amber-300 animate-pulse' : (rematchRequested ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 border-transparent' : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white border-amber-500/50')}`}
                            >
                                <Swords size={16} className="mr-2" />
                                <span>{opponentRematchRequested && !rematchRequested ? t('Multiplayer.rematch') : (rematchRequested ? t('Multiplayer.rematchRequested') : t('Multiplayer.rematch'))}</span>
                            </button>
                            <button
                                onClick={onNextGame}
                                className="col-span-1 py-4 px-4 bg-linear-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden group"
                            >
                                <UserPlus size={16} />
                                <span>{t('Multiplayer.newGame')}</span>
                            </button>
                        </>
                    )}
                    {gameMode === 'local' && (
                        <button onClick={() => onStartComputerGame(1500)} className="col-span-2 py-4 px-4 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-3 overflow-hidden group">
                            <Monitor size={18} className="group-hover:scale-110 transition-transform" />
                            <span>{t('Multiplayer.practiceVsComputer')}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
