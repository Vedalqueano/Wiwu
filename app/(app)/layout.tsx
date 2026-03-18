"use client";

import { Sidebar, TopBar } from "@/components/shell";
import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/channels": "Canais",
  "/departments": "Departamentos",
  "/tasks": "Tarefas",
  "/people": "Membros & Comunicação",
  "/notifications": "Notificações",
  "/settings": "Configurações",
  "/knowledge-base": "Knowledge Base",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = Object.entries(TITLES).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] || "WiWU Flow";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-[22px] bg-[var(--color-page)]">
          {children}
        </main>
      </div>
    </div>
  );
}
