"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Users, FileText, BarChart3, ClipboardList, CalendarDays,
  TrendingUp, Package, ShoppingBag, Headphones, Megaphone, Wallet,
  ChevronRight, BookOpen,
} from "lucide-react";

type Policy = {
  id: string;
  title: string;
  version: number;
  published: boolean;
  updatedAt: string;
};

/* ── Departamentos ────────────────── */
const DEPARTMENTS = [
  {
    id: "logistica", name: "Logística", icon: Package, color: "#E6141E",
    head: "Vitória", members: 3,
    kpis: [
      { label: "Pedidos/dia", value: "47", delta: "+12%", good: true },
      { label: "Acurácia estoque", value: "97.3%", delta: "+0.5%", good: true },
      { label: "Tempo médio sep.", value: "14min", delta: "-2min", good: true },
    ],
    channels: ["#separação", "#conferência", "#envios"],
    processes: ["Recebimento e Armazenagem", "Separação de Pedidos", "Conferência e Embalagem", "Envio e Rastreio", "Trocas e Devoluções"],
  },
  {
    id: "vendas", name: "Vendas / Loja", icon: ShoppingBag, color: "#7DAA4A",
    head: "Meire", members: 2,
    kpis: [
      { label: "Vendas hoje", value: "R$ 4.280", delta: "+8%", good: true },
      { label: "Meta mensal", value: "62%", delta: "no prazo", good: true },
      { label: "Ticket médio", value: "R$ 189", delta: "+15%", good: true },
    ],
    channels: ["#geral-vendas", "#atacado", "#metas", "#promoções"],
    processes: ["Registro de Vendas", "Metas e Comissionamento", "Abastecimento de Gôndola", "Atendimento Atacado"],
  },
  {
    id: "sac", name: "SAC", icon: Headphones, color: "#1A3A8F",
    head: "Cássia", members: 1,
    kpis: [
      { label: "NPS", value: "78", delta: "+3pts", good: true },
      { label: "SLA resposta", value: "2h", delta: "dentro", good: true },
      { label: "Tickets abertos", value: "12", delta: "5 urgentes", good: false },
    ],
    channels: ["#suporte", "#reclamações"],
    processes: ["Atendimento ao Cliente", "Gerenciamento de Tickets", "Pós-Venda"],
  },
  {
    id: "marketing", name: "Marketing", icon: Megaphone, color: "#B84870",
    head: "Mayara", members: 1,
    kpis: [
      { label: "Impressões", value: "45.2K", delta: "+22%", good: true },
      { label: "CTR médio", value: "3.4%", delta: "+0.8%", good: true },
      { label: "Campanhas ativas", value: "4", delta: "2 novas", good: true },
    ],
    channels: ["#campanhas", "#resultados"],
    processes: ["Planejamento de Campanhas", "Gestão de Mídias Sociais", "Análise de Resultados"],
  },
  {
    id: "financeiro", name: "Financeiro", icon: Wallet, color: "#C9881A",
    head: "Abbas", members: 1,
    kpis: [
      { label: "Faturamento mês", value: "R$ 127K", delta: "+5%", good: true },
      { label: "Margem líquida", value: "18.5%", delta: "+1.2%", good: true },
      { label: "Contas a pagar", value: "R$ 34K", delta: "8 vencendo", good: false },
    ],
    channels: ["#financeiro"],
    processes: ["Conciliação Bancária", "Contas a Pagar", "Contas a Receber", "Relatórios Fiscais"],
  },
];

const TABS = [
  { id: "overview", label: "Visão Geral", icon: BarChart3 },
  { id: "processes", label: "Processos", icon: ClipboardList },
  { id: "kpis", label: "KPIs", icon: TrendingUp },
  { id: "people", label: "Pessoas", icon: Users },
  { id: "schedule", label: "Escala", icon: CalendarDays },
];

export default function DepartmentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const isGlobal = user?.role === "SUPER" || user?.role === "ADMIN";
  const userDeptSlug = user?.departmentSlug as string | undefined;

  // SUPER e ADMIN veem todos; demais veem apenas o próprio departamento
  const visibleDepts = isGlobal
    ? DEPARTMENTS
    : DEPARTMENTS.filter((d) => d.id === userDeptSlug);

  const [activeDept, setActiveDept] = useState(DEPARTMENTS[0]);
  const [activeTab, setActiveTab] = useState("overview");

  // Quando a sessão carrega, ajusta o dept ativo para o do usuário (se não for global)
  useEffect(() => {
    if (!isGlobal && userDeptSlug) {
      const myDept = DEPARTMENTS.find((d) => d.id === userDeptSlug);
      if (myDept) setActiveDept(myDept);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDeptSlug, isGlobal]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  // Buscar políticas do DB quando aba "processes" é aberta
  // ou quando o departamento muda (usamos o nome como chave de busca)
  useEffect(() => {
    if (activeTab !== "processes") return;
    setPoliciesLoading(true);
    fetch("/api/policies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Filtrar pelo nome do departamento ativo
          setPolicies(data.filter((p: any) => p.department?.name === activeDept.name));
        }
      })
      .finally(() => setPoliciesLoading(false));
  }, [activeTab, activeDept.name]);

  return (
    <div className="flex h-full -m-[22px] animate-fade-in">
      {/* Department list */}
      <div className="w-[220px] bg-white border-r border-[var(--color-border)] flex flex-col shrink-0">
        <div className="p-3.5 border-b border-[var(--color-border)]">
          <h2 className="text-[13px] font-bold text-[var(--color-t1)]">Departamentos</h2>
          <p className="text-[11px] text-[var(--color-t3)] mt-0.5">{visibleDepts.length} departamento{visibleDepts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1.5">
          {visibleDepts.map((dept) => {
            const isActive = dept.id === activeDept.id;
            return (
              <button
                key={dept.id}
                onClick={() => { setActiveDept(dept); setActiveTab("overview"); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-[8px] mx-1 rounded-[var(--radius-sm)] text-left transition-all cursor-pointer",
                  isActive ? "bg-[var(--color-navy-light)]" : "hover:bg-[var(--color-page)]"
                )}
                style={{ width: "calc(100% - 8px)" }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: dept.color + "14" }}>
                  <dept.icon className="w-3.5 h-3.5" style={{ color: dept.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-[12.5px] truncate", isActive ? "font-semibold text-[var(--color-t1)]" : "text-[var(--color-t2)]")}>
                    {dept.name}
                  </div>
                  <div className="text-[10.5px] text-[var(--color-t3)]">{dept.members} membros</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Department content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-[var(--color-border)] px-5 pt-4 pb-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: activeDept.color + "14" }}>
              <activeDept.icon className="w-5 h-5" style={{ color: activeDept.color }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--color-t1)]">{activeDept.name}</h2>
              <p className="text-[12px] text-[var(--color-t3)]">Responsável: {activeDept.head} · {activeDept.members} membros</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-t-[var(--radius-sm)] transition-colors cursor-pointer border-b-2",
                  activeTab === tab.id
                    ? "text-[var(--color-navy)] border-[var(--color-navy)] bg-[var(--color-navy-light)]"
                    : "text-[var(--color-t3)] border-transparent hover:text-[var(--color-t2)]"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-[var(--color-page)]">
          {activeTab === "overview" && (
            <div className="animate-fade-in space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3">
                {activeDept.kpis.map((kpi, i) => (
                  <div key={i} className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-1">{kpi.label}</div>
                    <div className="text-[22px] font-bold text-[var(--color-t1)] tracking-tight">{kpi.value}</div>
                    <div className={cn("text-[11px] font-semibold mt-1", kpi.good ? "text-[var(--color-green)]" : "text-[var(--color-red)]")}>
                      {kpi.delta}
                    </div>
                  </div>
                ))}
              </div>

              {/* Channels and Processes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
                  <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-3">Canais</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeDept.channels.map((ch) => (
                      <span key={ch} className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[var(--color-navy-light)] text-[var(--color-navy)] cursor-pointer hover:bg-[#050A2D14] transition-colors">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
                  <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-3">Processos ({activeDept.processes.length})</h3>
                  <div className="flex flex-col gap-1.5">
                    {activeDept.processes.map((proc) => (
                      <div key={proc} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--color-page)] transition-colors cursor-pointer">
                        <FileText className="w-3.5 h-3.5 text-[var(--color-t3)]" />
                        <span className="text-[12.5px] text-[var(--color-t2)]">{proc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "processes" && (
            <div className="animate-fade-in">
              <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-bold text-[var(--color-t1)]">Processos e SOPs — {activeDept.name}</h3>
                  <button
                    onClick={() => router.push("/knowledge-base")}
                    className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--color-navy)] hover:underline cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Ver Knowledge Base
                  </button>
                </div>
                {policiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-[var(--color-navy)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : policies.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {policies.map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => router.push("/knowledge-base")}
                        className="flex items-center gap-3 p-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:bg-[var(--color-page)] transition-colors cursor-pointer text-left w-full"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ background: activeDept.color }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-[var(--color-t1)] truncate">{p.title}</div>
                          <div className="text-[11px] text-[var(--color-t3)]">
                            v{p.version} · Atualizado em {new Date(p.updatedAt).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            p.published
                              ? "bg-[var(--color-green-light)] text-[var(--color-green)]"
                              : "bg-[var(--color-border)] text-[var(--color-t3)]"
                          )}>
                            {p.published ? "Publicado" : "Rascunho"}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--color-t3)]" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <BookOpen className="w-10 h-10 text-[var(--color-border)] mb-3" />
                    <p className="text-[13px] font-semibold text-[var(--color-t2)]">Nenhum SOP publicado</p>
                    <p className="text-[12px] text-[var(--color-t3)] mt-1">
                      Acesse a{" "}
                      <button onClick={() => router.push("/knowledge-base")} className="text-[var(--color-navy)] font-semibold hover:underline cursor-pointer">
                        Knowledge Base
                      </button>{" "}
                      para criar documentos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === "kpis" || activeTab === "people" || activeTab === "schedule") && (
            <div className="animate-fade-in flex items-center justify-center h-[300px]">
              <div className="text-center">
                <div className="text-3xl mb-3">🚧</div>
                <p className="text-[14px] font-bold text-[var(--color-t1)]">Em construção</p>
                <p className="text-[12px] text-[var(--color-t3)] mt-1">
                  A aba {TABS.find(t => t.id === activeTab)?.label} está sendo desenvolvida.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
