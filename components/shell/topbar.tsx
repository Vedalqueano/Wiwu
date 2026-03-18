"use client";

import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import { SearchModal } from "./search-modal";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

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
            <span className="text-[12px] text-[var(--color-t2)] font-medium">{dateStr}</span>
          </div>

          {/* Notification bell */}
          <button className="relative w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center border border-[var(--color-border)] bg-white text-[var(--color-t2)] hover:bg-[var(--color-page)] transition-colors cursor-pointer">
            <Bell className="w-3.5 h-3.5" />
            <div className="absolute top-[5px] right-[5px] w-1.5 h-1.5 bg-[var(--color-red)] rounded-full border-[1.5px] border-white" />
          </button>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
