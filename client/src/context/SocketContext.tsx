// context/SocketContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const s = getSocket();
    setSocket(s);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    if (s.connected) setIsConnected(true);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (ctx === null) {
    throw new Error("useSocket must be used inside SocketProvider");
  }
  return ctx.socket;
}

export function useSocketConnection() {
  const ctx = useContext(SocketContext);
  if (ctx === null) {
    throw new Error("useSocketConnection must be used inside SocketProvider");
  }
  return ctx.isConnected;
}
