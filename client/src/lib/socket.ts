// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getOrCreatePlayerId(): string {
  try {
    // Check if player ID exists in localStorage
    let playerId = localStorage.getItem("chess_player_id");
    
    if (!playerId) {
      // Generate a new unique player ID
      playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("chess_player_id", playerId);
    }
    
    return playerId;
  } catch (e) {
    // Fallback if localStorage is blocked
    return `player_guest_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
  }
}

export function getSocket() {
  if (!socket) {
    const SOCKET_URL = "https://chessperiment.app";
    socket = io(SOCKET_URL, {
      path: "/chessperiment-server/socket.io",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });
    // Register player immediately on connection
    socket.on("connect", () => {
      console.log('✅ Socket connected to', SOCKET_URL);
      const playerId = getOrCreatePlayerId();
      console.log('📤 Registering player:', playerId);
      socket!.emit("register_player", { playerId });
    });

    socket.on("connect_error", (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
      if (socket) {
        if (reason === "io server disconnect") {
          socket.connect();
        } else if (reason === "transport close") {
          socket.connect();
        }
      }
    });
  }
  return socket;
}
