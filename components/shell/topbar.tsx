"use client";

import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SearchModal } from "./search-modal";
import { getSocket } from "@/lib/socket-client";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  // Atalho Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Buscar contagem inicial de notificações não lidas
  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((notifs: Array<{ read: boolean }>) => {
        if (Array.isArray(notifs)) {
          setUnreadCount(notifs.filter((n) => !n.read).length);
        }
      })
      .catch(() => {});
  }, []);

  // Entrar na sala pessoal e ouvir novas notificações via Socket.IO
  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    const socket = getSocket();

    const joinRoom = () => socket.emit("join-user-room", userId);
    joinRoom();
    socket.on("connect", joinRoom);

    socket.on("new-notification", () => {
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("connect", joinRoom);
      socket.off("new-notification");
    };
  }, [(session?.user as any)?.id]);

  return (
    <>
      <header className="h-[54px] bg-white border-b border-[var(--color-border)] flex items-center px-[22px] gap-3 shrink-0">
        <h1 className="text-[14px] font-bold text-[var(--color-t1)]">{title}</h1>

        <div className="ml-auto flex items-center gap-2">
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-page)] border border-[var(--color-border)] rounded-full text-sm text-[var(--color-t3)] cursor-pointer hover:border-[var(--color-border-2)] transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[12px]">Buscar...</span>
            <kbd className="ml-1 px-1 py-0.5 rounded border border-[var(--color-border)] text-[10px] font-mono bg-white hidden sm:block">
              Ctrl K
            </kbd>
          </button>

          {/* Date */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-page)] border border-[var(--color-border)] rounded-full">
            <span className="text-[12px] text-[var(--color-t2)] font-medium" suppressHydrationWarning>{dateStr}</span>
          </div>

          {/* Notification bell */}
          <button
            onClick={() => {
              setUnreadCount(0);
              router.push("/notifications");
            }}
            className="relative w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center border border-[var(--color-border)] bg-white text-[var(--color-t2)] hover:bg-[var(--color-page)] transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-[var(--color-red)] rounded-full border-[1.5px] border-white flex items-center justify-center">
                <span className="text-[9px] font-bold text-white px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </div>
            )}
          </button>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
