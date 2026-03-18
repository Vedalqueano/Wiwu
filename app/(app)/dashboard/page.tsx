"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FileText, Package, Truck, AlertTriangle,
  TrendingUp, Clock, CheckCircle, Loader2
} from "lucide-react";

/* ── Types ────────────────────────────────── */
type DashboardData = {
  kpis: { totalOrders: number; inSeparation: number; shipped: number; divergences: number };
  lowStockItems: { name: string; category: string; quantity: number; minimum: number; pct: number }[];
  tasks: { id: string; title: string; status: string; priority: string; assignee: string }[];
  recentMessages: { content: string; userName: string; channelName: string; createdAt: string }[];
  unreadNotifs: number;
};

/* ── KPI Card ─────────────────────────────── */
function KpiCard({ label, value, delta, deltaType, color, icon: Icon }: {
  label: string; value: string; delta: string; deltaType: "up" | "down" | "neutral";
  color: "blue" | "green" | "amber" | "red"; icon: React.ElementType;
}) {
  const colorMap = {
    blue: { bar: "bg-[var(--color-navy)]", iconBg: "bg-[#050A2D0D]", iconColor: "text-[var(--color-navy)]" },
    green: { bar: "bg-[var(--color-green)]", iconBg: "bg-[var(--color-green-light)]", iconColor: "text-[var(--color-green)]" },
    amber: { bar: "bg-[var(--color-amber)]", iconBg: "bg-[var(--color-amber-light)]", iconColor: "text-[var(--color-amber)]" },
    red: { bar: "bg-[var(--color-red)]", iconBg: "bg-[var(--color-red-light)]", iconColor: "text-[var(--color-red)]" },
  };
  const c = colorMap[color];
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)] relative overflow-hidden">
      <div className={cn("absolute bottom-0 left-0 right-0 h-[3px] rounded-b-[var(--radius-md)]", c.bar)} />
      <div className={cn("absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center justify-center", c.iconBg)}>
        <Icon className={cn("w-3.5 h-3.5", c.iconColor)} />
      </div>
      <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-2">{label}</div>
      <div className="text-[26px] font-bold text-[var(--color-t1)] tracking-tight leading-none">{value}</div>
      <div className={cn("text-[11.5px] mt-1.5 font-semibold",
        deltaType === "up" ? "text-[var(--color-green)]" :
        deltaType === "down" ? "text-[var(--color-red)]" : "text-[var(--color-t3)]"
      )}>{delta}</div>
    </div>
  );
}

/* ── Activity Item ────────────────────────── */
function Activity({ title, meta, color, icon: Icon }: {
  title: string; meta: string; color: "green" | "amber" | "blue"; icon: React.ElementType;
}) {
  const colorMap = {
    green: { bg: "bg-[var(--color-green-light)]", text: "text-[var(--color-green)]" },
    amber: { bg: "bg-[var(--color-amber-light)]", text: "text-[var(--color-amber)]" },
    blue: { bg: "bg-[var(--color-blue-light)]", text: "text-[var(--color-blue)]" },
  };
  const c = colorMap[color];
  return (
    <div className="flex gap-3.5 py-2.5 relative">
      <div className="absolute left-[11px] top-[28px] bottom-[-10px] w-px bg-[var(--color-border)]" />
      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10", c.bg)}>
        <Icon className={cn("w-[11px] h-[11px]", c.text)} />
      </div>
      <div className="flex-1 pt-0.5">
        <div className="text-[12.5px] font-semibold text-[var(--color-t1)]">{title}</div>
        <div className="text-[11px] text-[var(--color-t3)] mt-0.5">{meta}</div>
      </div>
    </div>
  );
}

/* ── Dashboard Page ──────────────────────── */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
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
        <span className="ml-2 text-[13px] text-[var(--color-t3)]">Carregando dashboard...</span>
      </div>
    );
  }

  const kpis = data?.kpis;
  const stockItems = data?.lowStockItems || [];

  return (
    <div className="animate-fade-in">
      {/* KPIs — dados do banco */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <KpiCard label="Pedidos hoje" value={String(kpis?.totalOrders ?? 0)} delta="↑ +12% vs ontem" deltaType="up" color="blue" icon={FileText} />
        <KpiCard label="Em separação" value={String(kpis?.inSeparation ?? 0)} delta="itens baixo estoque" deltaType="neutral" color="amber" icon={Package} />
        <KpiCard label="Enviados hoje" value={String(kpis?.shipped ?? 0)} delta={`concluídas`} deltaType="up" color="green" icon={Truck} />
        <KpiCard label="Divergências" value={String(kpis?.divergences ?? 0)} delta="requer atenção" deltaType="down" color="red" icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Pedidos pendentes — tarefas do banco */}
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)]">Tarefas ativas</h3>
            <span className="text-[11px] font-semibold text-[var(--color-navy)] cursor-pointer hover:underline">ver todas →</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b-[1.5px] border-[var(--color-border)]">
                <th className="p-2 text-left text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider bg-[var(--color-page)] rounded-tl-[var(--radius-sm)]">Tarefa</th>
                <th className="p-2 text-left text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider bg-[var(--color-page)]">Responsável</th>
                <th className="p-2 text-left text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider bg-[var(--color-page)]">Status</th>
                <th className="p-2 text-right text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider bg-[var(--color-page)] rounded-tr-[var(--radius-sm)]">Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {(data?.tasks || []).map((t) => {
                const statusCls = t.status === "DONE" ? "bg-[var(--color-green-light)] text-[var(--color-green)]"
                  : t.status === "IN_PROGRESS" ? "bg-[var(--color-amber-light)] text-[var(--color-amber)]"
                  : "bg-[var(--color-blue-light)] text-[var(--color-blue)]";
                const statusLabel = t.status === "DONE" ? "Feito" : t.status === "IN_PROGRESS" ? "Em andamento" : "A fazer";
                const priCls = t.priority === "URGENT" ? "text-[var(--color-red)]" : t.priority === "HIGH" ? "text-[var(--color-amber)]" : "text-[var(--color-t3)]";
                return (
                  <tr key={t.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[#050A2D04]">
                    <td className="p-2.5"><span className="font-semibold text-[var(--color-t1)]">{t.title}</span></td>
                    <td className="p-2.5 text-[var(--color-t2)]">{t.assignee}</td>
                    <td className="p-2.5">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold", statusCls)}>{statusLabel}</span>
                    </td>
                    <td className={cn("p-2.5 text-right font-bold text-[11px]", priCls)}>{t.priority}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Alertas de estoque — dados do banco */}
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)]">Alertas de estoque</h3>
            <span className="text-[11px] font-semibold text-[var(--color-navy)] cursor-pointer hover:underline">ver inventário →</span>
          </div>
          {stockItems.map((item, i) => {
            const barColor = item.pct < 30 ? "var(--color-red)" : item.pct < 60 ? "var(--color-amber)" : "var(--color-green)";
            const badge = item.pct < 30 ? "Crítico" : item.pct < 60 ? "Baixo" : "OK";
            const badgeCls = item.pct < 30 ? "bg-[var(--color-red-light)] text-[var(--color-red)]"
              : item.pct < 60 ? "bg-[var(--color-amber-light)] text-[var(--color-amber)]"
              : "bg-[var(--color-green-light)] text-[var(--color-green)]";
            return (
              <div key={i} className={cn("flex items-center gap-3 py-2.5", i < stockItems.length - 1 && "border-b border-[var(--color-border)]")}>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold text-[var(--color-t1)]">{item.name}</div>
                  <div className="text-[11px] text-[var(--color-t3)]">{item.category}</div>
                </div>
                <div className="w-20">
                  <div className="h-[5px] rounded-[3px] bg-[var(--color-border)]">
                    <div className="h-[5px] rounded-[3px] transition-all" style={{ width: `${item.pct}%`, background: barColor }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12.5px] font-bold" style={{ color: barColor }}>{item.quantity}</div>
                  <div className="text-[10.5px] text-[var(--color-t3)]">mín. {item.minimum}</div>
                </div>
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold", badgeCls)}>{badge}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Atividade recente — mensagens do banco */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-[13px] font-bold text-[var(--color-t1)]">Atividade recente</h3>
        </div>
        <div className="flex flex-col">
          {(data?.recentMessages || []).map((msg, i) => (
            <Activity
              key={i}
              title={`${msg.userName} em #${msg.channelName}`}
              meta={msg.content}
              color={i % 3 === 0 ? "green" : i % 3 === 1 ? "blue" : "amber"}
              icon={i % 2 === 0 ? CheckCircle : Clock}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
