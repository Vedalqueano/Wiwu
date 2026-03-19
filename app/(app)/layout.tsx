"use client";

import { useState, useCallback } from "react";
import { Sidebar, TopBar } from "@/components/shell";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Mural",
  "/channels": "Chat",
  "/people": "Membros",
  "/notifications": "Notificações",
  "/settings": "Configurações",
  "/knowledge-base": "Processos",
  "/admin": "Admin",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const title = Object.entries(TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] || "WiWU Flow";

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-[22px] bg-[var(--color-page)]">
          {children}
        </main>
      </div>
    </div>
  );
}
