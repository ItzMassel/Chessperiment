"use client";
import { useRouter } from 'next/navigation';
import GameLobby from './GameLobby';
import { useSocket } from '@/context/SocketContext';
import { useState, useEffect } from 'react';
export default function GamePage() {
    const router = useRouter();
    const socket = useSocket();
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!socket) return;
        const handleMatchFound = (data: { roomId: string }) => {
            setIsSearching(false);
            router.push(`/game/${data.roomId}?mode=join`);
        };

        const handleQuickSearchStarted = () => {
        };

        const handleSearchCancelled = () => {
            setIsSearching(false);
        };

        socket.on('match_found', handleMatchFound);
        socket.on('quick_search_started', handleQuickSearchStarted);
        socket.on('search_cancelled', handleSearchCancelled);

        return () => {
            socket.off('match_found', handleMatchFound);
            socket.off('quick_search_started', handleQuickSearchStarted);
            socket.off('search_cancelled', handleSearchCancelled);
        };
    }, [socket, router]);

    const handleQuickSearch = () => {
        if (socket) {
            socket.emit('find_match', { elo: 1200 }); // Placeholder ELO
            setIsSearching(true);
        }
    };

    const handleCancelSearch = () => {
        setIsSearching(false);
        if (socket) {
            socket.emit("cancel_search");
        }
    };

    const handleCreateRoom = () => {
        // Generate room ID and navigate
        const roomId = Math.random().toString(36).substring(2, 10).toUpperCase();
        router.push(`/game/${roomId}?mode=create`);
    };

    const handleJoinRoom = (roomId: string) => {
        if (!roomId || roomId.length < 4) return;
        router.push(`/game/${roomId}?mode=join`);
    };

    const handleVsComputer = (elo: number) => {
        const roomId = `computer-${elo}`;
        router.push(`/game/${roomId}?mode=computer`);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
            <GameLobby
                onQuickSearch={handleQuickSearch}
                onCancelSearch={handleCancelSearch}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                onVsComputer={handleVsComputer}
                isSearching={isSearching}
            />
        </div>
    );
}
