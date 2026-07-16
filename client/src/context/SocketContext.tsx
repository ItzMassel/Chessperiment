// context/SocketContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(() => {
    if (typeof window !== 'undefined') {
      return getSocket();
    }
    return null;
  });

  useEffect(() => {
    if (!socket && typeof window !== 'undefined') {
      setSocket(getSocket());
    }

    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (socket === undefined) {
    throw new Error("useSocket must be used inside SocketProvider");
  }
  return socket;
}
