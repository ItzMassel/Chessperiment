import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';

export function useStockfish(roomId: string, difficulty: number = 1300, onBestMove: (move: string) => void) {
  const [isReady, setIsReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const onBestMoveRef = useRef(onBestMove);
  const socket = useSocket();

  // Update ref when onBestMove changes
  useEffect(() => {
    onBestMoveRef.current = onBestMove;
  }, [onBestMove]);

  const [error, setError] = useState<string | null>(null);

  // Server-side Logic Only
  useEffect(() => {
    if (!socket) return;

    const onComputerMove = (data: { bestMove: string | null }) => {
      setIsThinking(false);
      // Only call onBestMove if we have a valid move
      if (data && data.bestMove && data.bestMove !== '(none)' && data.bestMove !== null) {
        onBestMoveRef.current(data.bestMove);
        setError(null);
      } else {
        console.warn('[Stockfish] No valid move received:', data);
        setError("Stockfish failed to return a move.");
      }
    };

    socket.on("computer_move_result", onComputerMove);
    setIsReady(true); // Server is assumed ready if connected

    return () => {
      socket.off("computer_move_result", onComputerMove);
    };
  }, [socket]);

  const requestMove = useCallback((_fenOverride?: string) => {
    setIsThinking(true);
    setError(null);

    if (socket && roomId) {
      // SECURITY: Only send roomId and difficulty, server provides the FEN from its own state
      socket.emit("request_computer_move", { roomId, difficulty });
    } else {
      console.warn("Socket or RoomId not available for server stockfish");
      setIsThinking(false);
    }
  }, [roomId, difficulty, socket]);

  return { isReady, isThinking, requestMove, error };
}
