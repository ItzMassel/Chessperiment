// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getOrCreatePlayerId(): string {
  try {
    // Check if player ID exists in localStorage
    let playerId = localStorage.getItem("chess_player_id");
    
    if (!playerId) {
      // Generate a new unique player ID
      playerId = crypto.randomUUID();
      localStorage.setItem("chess_player_id", playerId);
    }
    
    return playerId;
  } catch (e) {
    // Fallback if localStorage is blocked
    return crypto.randomUUID();
  }
}

export function getSocket() {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002";
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });
    // Register player immediately on connection
    socket.on("connect", () => {
      const playerId = getOrCreatePlayerId();
      socket!.emit("register_player", { playerId });
    });

    socket.on("connect_error", (error) => {
    });

    socket.on("disconnect", (reason) => {
    });
  }
  return socket;
}
