"use client";

import { useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket-client";

type Message = {
  id: string;
  content: string;
  channelId: string;
  channelName: string;
  userId: string;
  userName: string;
  userInitials: string;
  userColor: string;
  userPresence: string;
  reactions: { emoji: string; userName: string }[];
  createdAt: string;
};

export function useSocket(
  channelId: string,
  onNewMessage: (msg: Message) => void,
  onUserTyping: (userName: string) => void,
  onUserStopTyping: () => void
) {
  const socket = getSocket();

  useEffect(() => {
    if (!channelId) return;

    const rejoin = () => socket.emit("join-channel", channelId);

    socket.emit("join-channel", channelId);
    socket.on("connect", rejoin); // re-join ao reconectar (ex: HMR em desenvolvimento)
    socket.on("new-message", onNewMessage);
    socket.on("user-typing", ({ userName }: { userName: string }) => onUserTyping(userName));
    socket.on("user-stop-typing", onUserStopTyping);

    return () => {
      socket.emit("leave-channel", channelId);
      socket.off("connect", rejoin);
      socket.off("new-message", onNewMessage);
      socket.off("user-typing");
      socket.off("user-stop-typing");
    };
  }, [channelId]);

  const emitTyping = useCallback(
    (userName: string) => socket.emit("typing", { channelId, userName }),
    [channelId]
  );

  const emitStopTyping = useCallback(
    () => socket.emit("stop-typing", { channelId }),
    [channelId]
  );

  return { emitTyping, emitStopTyping };
}
