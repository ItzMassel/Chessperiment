"use client";
import React, { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import Board from '../Board';
import PlayBoard from '@/components/game/PlayBoard';

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

    useEffect(() => {
        if (!socket || !roomId) return;

        console.log("[BoardRouter] Joining room to determine type:", roomId);

        const onJoinedRoom = (data: any) => {
            if (data.roomId === roomId) {
                console.log("[BoardRouter] Joined room, isCustom:", !!data.isCustom);
                setIsCustom(!!data.isCustom);
                setCustomData(data.customData);
                if (data.boardState) setBoardState(data.boardState);
                setIsLoading(false);
            }
        };

        const onRejoinGame = (data: any) => {
            if (data.roomId === roomId) {
                console.log("[BoardRouter] Rejoined room, isCustom:", !!data.isCustom);
                setIsCustom(!!data.isCustom);
                setCustomData(data.customData);
                if (data.boardState) setBoardState(data.boardState);
                setIsLoading(false);
            }
        };

        const onRoomNotFound = (data: any) => {
            if (data.roomId === roomId) {
                console.log("[BoardRouter] Room not found");
                setIsCustom(false);
                setIsLoading(false);
            }
        };

        socket.on("joined_room", onJoinedRoom);
        socket.on("rejoin_game", onRejoinGame);
        socket.on("room_not_found", onRoomNotFound);

        // Emit join request to get the room type
        socket.emit("join_room", { roomId });

        return () => {
            socket.off("joined_room", onJoinedRoom);
            socket.off("rejoin_game", onRejoinGame);
            socket.off("room_not_found", onRoomNotFound);
        };
    }, [socket, roomId]);

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
