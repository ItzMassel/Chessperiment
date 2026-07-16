"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useSocket } from '@/context/SocketContext';
import Board from '../Board';
import PlayBoard from '@/components/game/PlayBoard';

// Standard chess starting position
const DEFAULT_STANDARD_PROJECT = {
    id: 'local-hotseat',
    userId: 'guest',
    name: 'Standard Chess',
    description: 'Local hotseat game',
    isStarred: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    rows: 8,
    cols: 8,
    gridType: 'square' as const,
    activeSquares: [
        'a1','b1','c1','d1','e1','f1','g1','h1',
        'a2','b2','c2','d2','e2','f2','g2','h2',
        'a3','b3','c3','d3','e3','f3','g3','h3',
        'a4','b4','c4','d4','e4','f4','g4','h4',
        'a5','b5','c5','d5','e5','f5','g5','h5',
        'a6','b6','c6','d6','e6','f6','g6','h6',
        'a7','b7','c7','d7','e7','f7','g7','h7',
        'a8','b8','c8','d8','e8','f8','g8','h8',
    ],
    placedPieces: {
        'a1': { type: 'rook', color: 'white' },
        'b1': { type: 'knight', color: 'white' },
        'c1': { type: 'bishop', color: 'white' },
        'd1': { type: 'queen', color: 'white' },
        'e1': { type: 'king', color: 'white' },
        'f1': { type: 'bishop', color: 'white' },
        'g1': { type: 'knight', color: 'white' },
        'h1': { type: 'rook', color: 'white' },
        'a2': { type: 'pawn', color: 'white' },
        'b2': { type: 'pawn', color: 'white' },
        'c2': { type: 'pawn', color: 'white' },
        'd2': { type: 'pawn', color: 'white' },
        'e2': { type: 'pawn', color: 'white' },
        'f2': { type: 'pawn', color: 'white' },
        'g2': { type: 'pawn', color: 'white' },
        'h2': { type: 'pawn', color: 'white' },
        'a7': { type: 'pawn', color: 'black' },
        'b7': { type: 'pawn', color: 'black' },
        'c7': { type: 'pawn', color: 'black' },
        'd7': { type: 'pawn', color: 'black' },
        'e7': { type: 'pawn', color: 'black' },
        'f7': { type: 'pawn', color: 'black' },
        'g7': { type: 'pawn', color: 'black' },
        'h7': { type: 'pawn', color: 'black' },
        'a8': { type: 'rook', color: 'black' },
        'b8': { type: 'knight', color: 'black' },
        'c8': { type: 'bishop', color: 'black' },
        'd8': { type: 'queen', color: 'black' },
        'e8': { type: 'king', color: 'black' },
        'f8': { type: 'bishop', color: 'black' },
        'g8': { type: 'knight', color: 'black' },
        'h8': { type: 'rook', color: 'black' },
    },
    customPieces: [],
};

interface BoardRouterProps {
    roomId: string;
    mode?: string;
}

export default function BoardRouter({ roomId, mode }: BoardRouterProps) {
    const socket = useSocket();
    const [isCustom, setIsCustom] = useState<boolean | null>(null);
    const [customData, setCustomData] = useState<any>(null);
    const [boardState, setBoardState] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const localProject = useMemo(() => ({
        ...DEFAULT_STANDARD_PROJECT,
        id: `local-${roomId}`,
    }), [roomId]);

    useEffect(() => {
        // For 'create', 'computer', and 'local' modes the room doesn't exist on the server yet —
        // skip the probe entirely and let Board / PlayBoard handle creation / joining itself.
        if (mode === 'create' || mode === 'computer') {
            setIsCustom(false);
            setIsLoading(false);
            return;
        }
        if (mode === 'local') {
            setIsCustom(true);
            setIsLoading(false);
            return;
        }

        if (!socket || !roomId) return;

        console.log("[BoardRouter] Probing room type:", roomId);

        const onJoinedRoom = (data: any) => {
            if (data.roomId === roomId || data.roomId?.toUpperCase() === roomId?.toUpperCase()) {
                console.log("[BoardRouter] Joined room, isCustom:", !!data.isCustom);
                setIsCustom(!!data.isCustom);
                setCustomData(data.customData);
                if (data.boardState) setBoardState(data.boardState);
                setIsLoading(false);
            }
        };

        const onRejoinGame = (data: any) => {
            if (data.roomId === roomId || data.roomId?.toUpperCase() === roomId?.toUpperCase()) {
                console.log("[BoardRouter] Rejoined room, isCustom:", !!data.isCustom);
                setIsCustom(!!data.isCustom);
                setCustomData(data.customData);
                if (data.boardState) setBoardState(data.boardState);
                setIsLoading(false);
            }
        };

        const onRoomNotFound = (data: any) => {
            if (data.roomId === roomId || data.roomId?.toUpperCase() === roomId?.toUpperCase()) {
                console.log("[BoardRouter] Room not found");
                setIsCustom(false);
                setIsLoading(false);
            }
        };

        socket.on("joined_room", onJoinedRoom);
        socket.on("rejoin_game", onRejoinGame);
        socket.on("room_not_found", onRoomNotFound);

        // Probe join to determine if this is a custom or standard game
        socket.emit("join_room", { roomId });

        return () => {
            socket.off("joined_room", onJoinedRoom);
            socket.off("rejoin_game", onRejoinGame);
            socket.off("room_not_found", onRoomNotFound);
        };
    }, [socket, roomId, mode]);

    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center select-none caret-transparent">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Determining game type...</p>
                </div>
            </div>
        );
    }

    if (mode === 'local') {
        return (
            <PlayBoard
                project={localProject}
                mode="local"
            />
        );
    }

    if (isCustom) {
        return (
            <PlayBoard
                roomId={roomId}
                project={customData}
                initialBoardState={boardState}
                mode="online"
            />
        );
    }

    return (
        <Board
            initialRoomId={roomId}
            gameModeVar={mode === 'computer' ? 'computer' : 'online'}
            mode={mode as any}
        />
    );
}
