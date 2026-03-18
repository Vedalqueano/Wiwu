"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bell, MessageSquare, CheckSquare, Package, AlertTriangle,
  Megaphone, Check, Loader2,
} from "lucide-react";

type Notif = { id: string; type: string; title: string; body: string | null; read: boolean; createdAt: string };

const ICON_MAP: Record<string, React.ElementType> = {
  MENTION: AtSignIcon,
  DIRECT_MESSAGE: MessageSquare,
  TASK_ASSIGNED: CheckSquare,
  LOW_STOCK: Package,
  ALERT: AlertTriangle,
  ANNOUNCEMENT: Megaphone,
};

const COLOR_MAP: Record<string, string> = {
  MENTION: "var(--color-navy)",
  DIRECT_MESSAGE: "#B84870",
  TASK_ASSIGNED: "var(--color-blue)",
  LOW_STOCK: "var(--color-red)",
  ALERT: "var(--color-amber)",
  ANNOUNCEMENT: "var(--color-amber)",
};

function AtSignIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="8" r="3" /><path d="M11 8v1.5a1.5 1.5 0 003 0V8a7 7 0 10-3 5.7" />
    </svg>
  );
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then(setNotifs).catch(console.error).finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(console.error);
  };

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) }).catch(console.error);
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-[var(--color-navy)] animate-spin" /><span className="ml-2 text-[13px] text-[var(--color-t3)]">Carregando notificações...</span></div>;

  return (
    <div className="animate-fade-in max-w-[700px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-[var(--color-t1)]">Notificações</h2>
          <p className="text-[12px] text-[var(--color-t3)]">{unreadCount > 0 ? `${unreadCount} não lidas` : "Todas lidas ✓"}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-[var(--color-navy)] bg-[var(--color-navy-light)] rounded-[var(--radius-sm)] hover:bg-[#050A2D14] transition-colors cursor-pointer">
            <Check className="w-3.5 h-3.5" /> Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {notifs.map((n) => {
          const Icon = ICON_MAP[n.type] || Bell;
          const color = COLOR_MAP[n.type] || "var(--color-t3)";
          return (
            <div key={n.id} onClick={() => !n.read && markRead(n.id)} className={cn("flex gap-3.5 p-4 rounded-[var(--radius-md)] border transition-all cursor-pointer", n.read ? "bg-white border-[var(--color-border)] opacity-70" : "bg-white border-[var(--color-navy)] shadow-[var(--shadow-sm)]")}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "14" }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className={cn("text-[13px] leading-tight", n.read ? "text-[var(--color-t2)]" : "font-bold text-[var(--color-t1)]")}>{n.title}</span>
                  <span className="text-[10.5px] text-[var(--color-t3)] whitespace-nowrap shrink-0">{timeAgo(n.createdAt)}</span>
                </div>
                {n.body && <p className="text-[12px] text-[var(--color-t3)] mt-0.5">{n.body}</p>}
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-[var(--color-red)] shrink-0 mt-2" />}
            </div>
          );
        })}
        {notifs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-2xl mb-2">🔔</div>
            <p className="text-[13px] text-[var(--color-t3)]">Nenhuma notificação</p>
          </div>
        )}
      </div>
    </div>
  );
}
