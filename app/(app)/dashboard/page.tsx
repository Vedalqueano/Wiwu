"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Megaphone, Pin, Clock, AlertTriangle, BookOpen,
  MessageSquare, Loader2, ArrowRight, CircleDot,
} from "lucide-react";

/* ── Types ────────────────────────────────── */
type MuralData = {
  announcements: { id: string; title: string; content: string; pinned: boolean; createdAt: string }[];
  tasks: { id: string; title: string; status: string; priority: string; dueDate: string | null; assignee: { name: string; initials: string; color: string } | null }[];
  policies: { id: string; title: string; departmentName: string; departmentColor: string; updatedAt: string }[];
  recentMessages: { id: string; content: string; userName: string; userInitials: string; userColor: string; channelName: string; createdAt: string }[];
  unreadNotifs: number;
};

/* ── Section Header ──────────────────────── */
function SectionHeader({ icon: Icon, title, href, count }: {
  icon: React.ElementType; title: string; href?: string; count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--color-navy)]" />
        <h3 className="text-[13px] font-bold text-[var(--color-t1)]">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 bg-[var(--color-navy)]">
            {count}
          </span>
        )}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-navy)] hover:underline">
          ver tudo <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

/* ── Priority Badge ──────────────────────── */
function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    URGENT: { label: "Urgente", cls: "bg-[var(--color-red-light)] text-[var(--color-red)]" },
    HIGH: { label: "Alta", cls: "bg-[var(--color-amber-light)] text-[var(--color-amber)]" },
    MEDIUM: { label: "Média", cls: "bg-[var(--color-blue-light)] text-[var(--color-blue)]" },
    LOW: { label: "Baixa", cls: "bg-slate-100 text-slate-500" },
  };
  const p = map[priority] || map.MEDIUM;
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold", p.cls)}>{p.label}</span>;
}

/* ── Status Dot ──────────────────────────── */
function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    TODO: "bg-slate-400",
    IN_PROGRESS: "bg-[var(--color-amber)]",
    REVIEW: "bg-[var(--color-blue)]",
  };
  return <div className={cn("w-2 h-2 rounded-full shrink-0", colors[status] || "bg-slate-400")} />;
}

/* ── Mural Page ──────────────────────────── */
export default function MuralPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<MuralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <Loader2 className="w-6 h-6 text-[var(--color-navy)] animate-spin" />
        <span className="ml-2 text-[13px] text-[var(--color-t3)]">Carregando mural...</span>
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    TODO: "A fazer",
    IN_PROGRESS: "Em andamento",
    REVIEW: "Em revisão",
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="text-2xl font-bold tracking-tight mb-1">Mural</div>
      <div className="text-sm text-[var(--color-t3)] mb-6" suppressHydrationWarning>
        Olá, {session?.user?.name?.split(" ")[0] || "Usuário"}! —{" "}
        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      </div>

      {/* Comunicados */}
      {(data?.announcements?.length ?? 0) > 0 && (
        <div className="mb-4">
          <SectionHeader icon={Megaphone} title="Comunicados" />
          <div className="grid gap-2">
            {data!.announcements.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "bg-white border rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]",
                  a.pinned ? "border-[var(--color-navy)]/30 bg-[#050A2D04]" : "border-[var(--color-border)]"
                )}
              >
                <div className="flex items-start gap-3">
                  {a.pinned && <Pin className="w-3.5 h-3.5 text-[var(--color-navy)] mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-[var(--color-t1)] mb-1">{a.title}</div>
                    <p className="text-[12.5px] text-[var(--color-t2)] line-clamp-2">{a.content}</p>
                  </div>
                  <span className="text-[10px] text-[var(--color-t3)] shrink-0 mt-0.5">
                    {new Date(a.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Minhas Tarefas */}
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
          <SectionHeader icon={CircleDot} title="Minhas Tarefas" count={data?.tasks?.length} />
          {(data?.tasks?.length ?? 0) === 0 ? (
            <p className="text-[12px] text-[var(--color-t3)] py-4 text-center">Nenhuma tarefa pendente</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data!.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2 px-3 rounded-[var(--radius-sm)] bg-[var(--color-page)] border border-[var(--color-border)]">
                  <StatusDot status={t.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-[var(--color-t1)] truncate">{t.title}</div>
                    <div className="text-[10.5px] text-[var(--color-t3)]">
                      {statusLabel[t.status] || t.status}
                      {t.dueDate && (
                        <> · <Clock className="w-3 h-3 inline -mt-0.5" /> {new Date(t.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</>
                      )}
                    </div>
                  </div>
                  <PriorityBadge priority={t.priority} />
                  {t.assignee && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ background: t.assignee.color }}
                      title={t.assignee.name}
                    >
                      {t.assignee.initials}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processos Recentes */}
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
          <SectionHeader icon={BookOpen} title="Processos Recentes" href="/knowledge-base" />
          {(data?.policies?.length ?? 0) === 0 ? (
            <p className="text-[12px] text-[var(--color-t3)] py-4 text-center">Nenhum processo publicado</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data!.policies.map((p) => (
                <Link
                  key={p.id}
                  href="/knowledge-base"
                  className="flex items-center gap-3 py-2.5 px-3 rounded-[var(--radius-sm)] bg-[var(--color-page)] border border-[var(--color-border)] hover:border-[var(--color-navy)]/30 transition-colors"
                >
                  <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: p.departmentColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-[var(--color-t1)] truncate">{p.title}</div>
                    <div className="text-[10.5px] text-[var(--color-t3)]">{p.departmentName}</div>
                  </div>
                  <span className="text-[10px] text-[var(--color-t3)] shrink-0">
                    {new Date(p.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
        <SectionHeader icon={MessageSquare} title="Atividade Recente" href="/channels" />
        {(data?.recentMessages?.length ?? 0) === 0 ? (
          <p className="text-[12px] text-[var(--color-t3)] py-4 text-center">Nenhuma mensagem recente</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data!.recentMessages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: msg.userColor }}
                >
                  {msg.userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12.5px] font-bold text-[var(--color-t1)]">{msg.userName}</span>
                    <span className="text-[10px] text-[var(--color-t3)]">em #{msg.channelName}</span>
                    <span className="text-[10px] text-[var(--color-t3)] ml-auto shrink-0">
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--color-t2)] line-clamp-1 mt-0.5">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
