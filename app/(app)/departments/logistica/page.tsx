"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FileText, Package, Truck, AlertTriangle, RotateCcw, Warehouse,
  TrendingUp, Clock, CheckCircle, ArrowRight, ChevronRight,
  Printer, Barcode, CreditCard, Send as SendIcon, Eye, Search, Filter,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   DADOS DE DEMONSTRAÇÃO
   ═══════════════════════════════════════════════ */
const TABS = ["Dashboard", "Pedidos", "Separação", "Envios", "Trocas", "Inventário"];

const PEDIDOS = [
  { id: "#4478", cliente: "Cliente WiWU SP", itens: 3, total: "R$ 487,00", status: "separacao", transp: "Correios", data: "17/03" },
  { id: "#4477", cliente: "Atacado Sul", itens: 8, total: "R$ 2.340,00", status: "conferencia", transp: "Braspress", data: "17/03" },
  { id: "#4476", cliente: "Loja Parceira RJ", itens: 2, total: "R$ 198,00", status: "enviado", transp: "Correios", data: "16/03" },
  { id: "#4475", cliente: "Cliente Online MG", itens: 1, total: "R$ 89,90", status: "enviado", transp: "Motoboy", data: "16/03" },
  { id: "#4474", cliente: "Distribuidor PR", itens: 12, total: "R$ 4.560,00", status: "entregue", transp: "Braspress", data: "15/03" },
  { id: "#4473", cliente: "Loja Centro SP", itens: 5, total: "R$ 890,00", status: "entregue", transp: "Correios", data: "15/03" },
  { id: "#4472", cliente: "Cliente Online", itens: 2, total: "R$ 178,00", status: "divergencia", transp: "Motoboy", data: "17/03" },
  { id: "#4471", cliente: "Atacado Norte", itens: 6, total: "R$ 1.780,00", status: "enviado", transp: "Correios", data: "17/03" },
];

const INVENTARIO = [
  { sku: "WW-CHG-65W", nome: "Carregador USB-C 65W", cat: "Carregadores", qtd: 3, min: 15, loc: "A-01" },
  { sku: "WW-CASE-14", nome: 'Case MacBook 14"', cat: "Acessórios", qtd: 7, min: 20, loc: "B-03" },
  { sku: "WW-FONE-BT", nome: "Fone Bluetooth ANC", cat: "Áudio", qtd: 11, min: 20, loc: "C-02" },
  { sku: "WW-HUB-7C", nome: "Hub USB-C 7 em 1", cat: "Conectividade", qtd: 41, min: 10, loc: "A-05" },
  { sku: "WW-MOUSE-W", nome: "Mouse Wireless WiWU", cat: "Periféricos", qtd: 28, min: 10, loc: "B-01" },
  { sku: "WW-CABO-TC", nome: "Cabo Type-C 2m", cat: "Cabos", qtd: 52, min: 30, loc: "A-02" },
  { sku: "WW-STAND-N", nome: "Suporte Notebook", cat: "Acessórios", qtd: 15, min: 10, loc: "C-01" },
  { sku: "WW-POWER-20", nome: "Powerbank 20000mAh", cat: "Energia", qtd: 22, min: 15, loc: "A-04" },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  separacao: { label: "Separação", cls: "bg-[var(--color-amber-light)] text-[var(--color-amber)]" },
  conferencia: { label: "Conferência", cls: "bg-[var(--color-blue-light)] text-[var(--color-blue)]" },
  enviado: { label: "Enviado", cls: "bg-[var(--color-green-light)] text-[var(--color-green)]" },
  entregue: { label: "Entregue", cls: "bg-[var(--color-purple-light)] text-[var(--color-purple)]" },
  divergencia: { label: "Divergência", cls: "bg-[var(--color-red-light)] text-[var(--color-red)]" },
};

/* ═══════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════ */
export default function LogisticaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sepStep, setSepStep] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    const user = session?.user as any;
    const role = user?.role as string | undefined;
    const isGlobal = role === "SUPER" || role === "ADMIN";
    if (!isGlobal && user?.departmentSlug !== "logistica") {
      router.replace(user?.departmentSlug ? `/departments/${user.departmentSlug}` : "/departments");
    }
  }, [session, status, router]);

  if (status === "loading") return null;

  return (
    <div className="animate-fade-in">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-4 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-1 shadow-[var(--shadow-sm)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-[var(--radius-sm)] text-[12.5px] font-semibold transition-all cursor-pointer",
              activeTab === tab
                ? "bg-[var(--color-navy)] text-white shadow-sm"
                : "text-[var(--color-t2)] hover:bg-[var(--color-page)]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ──────────────────── */}
      {activeTab === "Dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Pedidos hoje", value: "47", delta: "↑ +12% vs ontem", icon: FileText, color: "blue" },
              { label: "Em separação", value: "4", delta: "aguardando", icon: Package, color: "amber" },
              { label: "Enviados hoje", value: "38", delta: "81% concluídos", icon: Truck, color: "green" },
              { label: "Divergências", value: "2", delta: "⚠ atenção", icon: AlertTriangle, color: "red" },
            ].map((kpi) => {
              const colorMap: Record<string, string> = { blue: "var(--color-navy)", amber: "var(--color-amber)", green: "var(--color-green)", red: "var(--color-red)" };
              return (
                <div key={kpi.label} className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)] relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: colorMap[kpi.color] }} />
                  <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-2">{kpi.label}</div>
                  <div className="text-[26px] font-bold text-[var(--color-t1)] tracking-tight leading-none">{kpi.value}</div>
                  <div className="text-[11px] mt-1.5 font-semibold" style={{ color: colorMap[kpi.color] }}>{kpi.delta}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Pedidos recentes */}
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-3">Pedidos recentes</h3>
              {PEDIDOS.slice(0, 4).map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-b-0">
                  <span className="text-[13px] font-bold text-[var(--color-t1)] w-12">{p.id}</span>
                  <span className="text-[12px] text-[var(--color-t2)] flex-1">{p.cliente}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", STATUS_MAP[p.status].cls)}>{STATUS_MAP[p.status].label}</span>
                </div>
              ))}
            </div>
            {/* Ações rápidas */}
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-3">Ações Rápidas</h3>
              {[
                { label: "Iniciar separação", icon: Package, desc: "4 pedidos aguardando" },
                { label: "Conferir pedido", icon: Barcode, desc: "#4477 pronto p/ conferência" },
                { label: "Resolver divergência", icon: AlertTriangle, desc: "#4472 requer atenção" },
                { label: "Inventário cíclico", icon: Warehouse, desc: "Seção 4 pendente" },
              ].map((a) => (
                <button key={a.label} className="w-full flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-page)] -mx-2 px-2 rounded-lg transition-colors cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-navy-light)] flex items-center justify-center">
                    <a.icon className="w-4 h-4 text-[var(--color-navy)]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[12.5px] font-semibold text-[var(--color-t1)]">{a.label}</div>
                    <div className="text-[11px] text-[var(--color-t3)]">{a.desc}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--color-t3)]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PEDIDOS ─────────────────────── */}
      {activeTab === "Pedidos" && (
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)]">Todos os Pedidos</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-sm)]">
                <Search className="w-3 h-3 text-[var(--color-t3)]" />
                <input className="bg-transparent text-[12px] outline-none w-32 placeholder:text-[var(--color-t3)]" placeholder="Buscar pedido..." />
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[12px] text-[var(--color-t2)] hover:bg-[var(--color-page)] cursor-pointer">
                <Filter className="w-3 h-3" /> Filtrar
              </button>
            </div>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-[var(--color-page)] border-b border-[var(--color-border)]">
                {["Pedido", "Cliente", "Itens", "Total", "Transp.", "Status", "Data", "Ação"].map((h) => (
                  <th key={h} className="p-3 text-left text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PEDIDOS.map((p) => (
                <tr key={p.id} className="border-b border-[var(--color-border)] hover:bg-[#050A2D03] transition-colors">
                  <td className="p-3 font-bold text-[var(--color-t1)]">{p.id}</td>
                  <td className="p-3 text-[var(--color-t2)]">{p.cliente}</td>
                  <td className="p-3 text-center">{p.itens}</td>
                  <td className="p-3 font-semibold text-[var(--color-t1)]">{p.total}</td>
                  <td className="p-3 text-[var(--color-t2)]">{p.transp}</td>
                  <td className="p-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", STATUS_MAP[p.status].cls)}>
                      {STATUS_MAP[p.status].label}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--color-t3)]">{p.data}</td>
                  <td className="p-3">
                    <button className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--color-navy)] text-white hover:bg-[var(--color-navy-2)] cursor-pointer">
                      {p.status === "separacao" ? "Separar" : p.status === "conferencia" ? "Conferir" : p.status === "divergencia" ? "Resolver" : "Ver"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SEPARAÇÃO ──────────────────── */}
      {activeTab === "Separação" && (
        <div className="space-y-4">
          {/* Steps */}
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-4">Processo de Separação — Pedido #4478</h3>
            <div className="flex items-center gap-2 mb-5">
              {["Imprimir", "Bipar itens", "Pagamento", "Envio"].map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => setSepStep(Math.max(i, sepStep))}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] transition-all cursor-pointer flex-1",
                      i <= sepStep
                        ? "bg-[var(--color-navy)] text-white"
                        : "bg-[var(--color-page)] text-[var(--color-t3)] border border-[var(--color-border)]"
                    )}
                  >
                    <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold", i < sepStep ? "bg-white/20" : i === sepStep ? "bg-white/20" : "bg-[var(--color-border)]")}>
                      {i < sepStep ? "✓" : i + 1}
                    </span>
                    <span className="text-[11px] font-bold">{step}</span>
                  </button>
                  {i < 3 && <ArrowRight className="w-3.5 h-3.5 text-[var(--color-t3)] shrink-0" />}
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className="border border-[var(--color-border)] rounded-[var(--radius-sm)] p-4 bg-[var(--color-page)]">
              {sepStep === 0 && (
                <div className="text-center py-6">
                  <Printer className="w-10 h-10 text-[var(--color-navy)] mx-auto mb-3" />
                  <p className="text-[13px] font-bold text-[var(--color-t1)] mb-1">Imprimir romaneio</p>
                  <p className="text-[12px] text-[var(--color-t3)] mb-4">Pedido #4478 · 3 itens · Cliente WiWU SP</p>
                  <button onClick={() => setSepStep(1)} className="px-5 py-2 bg-[var(--color-navy)] text-white text-[12px] font-bold rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] cursor-pointer">
                    🖨️ Imprimir e avançar
                  </button>
                </div>
              )}
              {sepStep === 1 && (
                <div>
                  <p className="text-[13px] font-bold text-[var(--color-t1)] mb-3">Bipar itens do pedido</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { sku: "WW-HUB-7C", nome: "Hub USB-C 7 em 1", qtd: 1, checked: true },
                      { sku: "WW-CABO-TC", nome: "Cabo Type-C 2m", qtd: 1, checked: true },
                      { sku: "WW-CHG-65W", nome: "Carregador USB-C 65W", qtd: 1, checked: false },
                    ].map((item) => (
                      <div key={item.sku} className={cn("flex items-center gap-3 p-3 rounded-lg border", item.checked ? "bg-[var(--color-green-light)] border-[var(--color-green)]" : "bg-white border-[var(--color-border)]")}>
                        <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[10px]", item.checked ? "bg-[var(--color-green)] text-white" : "border-[1.5px] border-[var(--color-border)]")}>
                          {item.checked && "✓"}
                        </div>
                        <div className="flex-1">
                          <span className="text-[12.5px] font-semibold text-[var(--color-t1)]">{item.nome}</span>
                          <span className="text-[11px] text-[var(--color-t3)] ml-2">{item.sku}</span>
                        </div>
                        <span className="text-[12px] font-bold text-[var(--color-t2)]">×{item.qtd}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setSepStep(2)} className="mt-4 px-5 py-2 bg-[var(--color-navy)] text-white text-[12px] font-bold rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] cursor-pointer">
                    Confirmar bipagem →
                  </button>
                </div>
              )}
              {sepStep === 2 && (
                <div className="text-center py-6">
                  <CreditCard className="w-10 h-10 text-[var(--color-navy)] mx-auto mb-3" />
                  <p className="text-[13px] font-bold text-[var(--color-t1)] mb-1">Conferir pagamento</p>
                  <p className="text-[12px] text-[var(--color-t3)] mb-1">Valor: R$ 487,00 · PIX confirmado ✅</p>
                  <p className="text-[11px] text-[var(--color-green)] font-bold mb-4">Pagamento aprovado</p>
                  <button onClick={() => setSepStep(3)} className="px-5 py-2 bg-[var(--color-navy)] text-white text-[12px] font-bold rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] cursor-pointer">
                    Avançar para envio →
                  </button>
                </div>
              )}
              {sepStep === 3 && (
                <div className="text-center py-6">
                  <Truck className="w-10 h-10 text-[var(--color-green)] mx-auto mb-3" />
                  <p className="text-[13px] font-bold text-[var(--color-t1)] mb-1">Pronto para envio!</p>
                  <p className="text-[12px] text-[var(--color-t3)] mb-1">Transportadora: Correios · Rastreio: BR123456789</p>
                  <p className="text-[11px] text-[var(--color-green)] font-bold mb-4">✅ Pedido #4478 finalizado</p>
                  <button onClick={() => setSepStep(0)} className="px-5 py-2 bg-[var(--color-green)] text-white text-[12px] font-bold rounded-[var(--radius-sm)] hover:opacity-90 cursor-pointer">
                    Concluir e próximo pedido
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Queue */}
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-3">Fila de Separação</h3>
            {PEDIDOS.filter((p) => p.status === "separacao").map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-b-0">
                <span className="text-[13px] font-bold text-[var(--color-t1)]">{p.id}</span>
                <span className="text-[12px] text-[var(--color-t2)] flex-1">{p.cliente} · {p.itens} itens</span>
                <span className="text-[12px] font-bold text-[var(--color-t1)]">{p.total}</span>
                <button className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--color-navy)] text-white cursor-pointer">Separar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ENVIOS ─────────────────────── */}
      {activeTab === "Envios" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { transp: "Correios", count: 24, icon: "📦", pct: 55 },
              { transp: "Motoboy", count: 8, icon: "🏍️", pct: 18 },
              { transp: "Braspress", count: 12, icon: "🚚", pct: 27 },
            ].map((t) => (
              <div key={t.transp} className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-[13px] font-bold text-[var(--color-t1)]">{t.transp}</span>
                </div>
                <div className="text-[24px] font-bold text-[var(--color-t1)] tracking-tight">{t.count}</div>
                <div className="mt-2 h-[5px] rounded bg-[var(--color-border)]">
                  <div className="h-[5px] rounded bg-[var(--color-navy)] transition-all" style={{ width: `${t.pct}%` }} />
                </div>
                <div className="text-[11px] text-[var(--color-t3)] mt-1">{t.pct}% dos envios</div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="text-[13px] font-bold text-[var(--color-t1)]">Rastreamento</h3>
            </div>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-[var(--color-page)] border-b border-[var(--color-border)]">
                  {["Pedido", "Cliente", "Transportadora", "Rastreio", "Status"].map((h) => (
                    <th key={h} className="p-3 text-left text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PEDIDOS.filter((p) => p.status === "enviado").map((p) => (
                  <tr key={p.id} className="border-b border-[var(--color-border)]">
                    <td className="p-3 font-bold">{p.id}</td>
                    <td className="p-3 text-[var(--color-t2)]">{p.cliente}</td>
                    <td className="p-3">{p.transp}</td>
                    <td className="p-3 text-[var(--color-navy)] font-mono text-[11px]">BR{Math.random().toString().slice(2, 11)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-green-light)] text-[var(--color-green)]">Em trânsito</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TROCAS ─────────────────────── */}
      {activeTab === "Trocas" && (
        <div className="space-y-4">
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-4">Processo de Troca — Atacado #38</h3>
            <div className="flex gap-3 mb-5">
              {["Teste Inicial", "Verificar", "Analisar", "Finalizar"].map((s, i) => (
                <div key={s} className={cn(
                  "flex-1 py-2.5 text-center rounded-[var(--radius-sm)] text-[12px] font-bold",
                  i <= 1 ? "bg-[var(--color-navy)] text-white" : "bg-[var(--color-page)] text-[var(--color-t3)] border border-[var(--color-border)]"
                )}>
                  {i < 2 ? "✓" : ""} {s}
                </div>
              ))}
            </div>
            <div className="border border-[var(--color-border)] rounded-[var(--radius-sm)] p-4 bg-[var(--color-page)]">
              <p className="text-[13px] font-bold text-[var(--color-t1)] mb-2">Etapa atual: Analisar</p>
              <p className="text-[12px] text-[var(--color-t2)] mb-1">Produto: WiWU Fone Bluetooth ANC · Motivo: Defeito de fabricação</p>
              <p className="text-[12px] text-[var(--color-t3)]">Ação: Substituição por unidade nova</p>
            </div>
          </div>
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-3">Histórico de Trocas</h3>
            {[
              { id: "T-042", prod: "Mouse Wireless", motivo: "Defeito botão", status: "Concluída", dt: "15/03" },
              { id: "T-041", prod: "Cabo Type-C 2m", motivo: "Enio errado", status: "Concluída", dt: "14/03" },
              { id: "T-040", prod: "Carregador 65W", motivo: "Não carrega", status: "Concluída", dt: "12/03" },
            ].map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-b-0">
                <span className="text-[13px] font-bold text-[var(--color-t1)] w-14">{t.id}</span>
                <span className="text-[12px] text-[var(--color-t2)] flex-1">{t.prod} — {t.motivo}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-green-light)] text-[var(--color-green)]">{t.status}</span>
                <span className="text-[11px] text-[var(--color-t3)]">{t.dt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INVENTÁRIO ─────────────────── */}
      {activeTab === "Inventário" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
              <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-1">Total SKUs</div>
              <div className="text-[24px] font-bold text-[var(--color-t1)]">{INVENTARIO.length}</div>
            </div>
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
              <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-1">Acurácia</div>
              <div className="text-[24px] font-bold text-[var(--color-green)]">97.3%</div>
            </div>
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
              <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-1">Estoque Baixo</div>
              <div className="text-[24px] font-bold text-[var(--color-red)]">{INVENTARIO.filter((i) => i.qtd < i.min).length}</div>
            </div>
          </div>
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <h3 className="text-[13px] font-bold text-[var(--color-t1)]">Inventário Completo</h3>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-sm)]">
                <Search className="w-3 h-3 text-[var(--color-t3)]" />
                <input className="bg-transparent text-[12px] outline-none w-32 placeholder:text-[var(--color-t3)]" placeholder="Buscar SKU..." />
              </div>
            </div>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="bg-[var(--color-page)] border-b border-[var(--color-border)]">
                  {["SKU", "Produto", "Categoria", "Local", "Qtd.", "Mín.", "Status"].map((h) => (
                    <th key={h} className="p-3 text-left text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVENTARIO.map((item) => {
                  const pct = (item.qtd / Math.max(item.min, 1)) * 100;
                  const isLow = item.qtd < item.min;
                  const isCritical = pct < 25;
                  return (
                    <tr key={item.sku} className={cn("border-b border-[var(--color-border)]", isLow && "bg-[var(--color-red-light)]")}>
                      <td className="p-3 font-mono text-[11px] text-[var(--color-navy)]">{item.sku}</td>
                      <td className="p-3 font-semibold text-[var(--color-t1)]">{item.nome}</td>
                      <td className="p-3 text-[var(--color-t2)]">{item.cat}</td>
                      <td className="p-3 text-[var(--color-t2)]">{item.loc}</td>
                      <td className="p-3 font-bold" style={{ color: isCritical ? "var(--color-red)" : isLow ? "var(--color-amber)" : "var(--color-t1)" }}>{item.qtd}</td>
                      <td className="p-3 text-[var(--color-t3)]">{item.min}</td>
                      <td className="p-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", isCritical ? "bg-[var(--color-red-light)] text-[var(--color-red)]" : isLow ? "bg-[var(--color-amber-light)] text-[var(--color-amber)]" : "bg-[var(--color-green-light)] text-[var(--color-green)]")}>
                          {isCritical ? "Crítico" : isLow ? "Baixo" : "OK"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
