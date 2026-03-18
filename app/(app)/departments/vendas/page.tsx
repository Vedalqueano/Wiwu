"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ShoppingBag, TrendingUp, Target, ClipboardCheck, BarChart3,
  Plus, ChevronRight, Award, Check, Star,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   DADOS DE DEMONSTRAÇÃO
   ═══════════════════════════════════════════════ */
const TABS = ["Dashboard", "Registrar Venda", "Histórico", "Metas", "Abastecimento", "Relatórios"];

const VENDAS = [
  { id: "V-1247", produto: "Hub USB-C 7 em 1", qtd: 3, tipo: "Atacado", pgto: "PIX", valor: "R$ 537,00", hora: "10:30", vendedor: "Meire" },
  { id: "V-1246", produto: "Carregador 65W", qtd: 1, tipo: "Varejo", pgto: "Cartão", valor: "R$ 189,90", hora: "10:15", vendedor: "Meire" },
  { id: "V-1245", produto: "Fone Bluetooth ANC", qtd: 2, tipo: "Varejo", pgto: "PIX", valor: "R$ 478,00", hora: "09:50", vendedor: "Mayara" },
  { id: "V-1244", produto: "Cabo Type-C 2m", qtd: 5, tipo: "Atacado", pgto: "Boleto", valor: "R$ 175,00", hora: "09:30", vendedor: "Meire" },
  { id: "V-1243", produto: "Mouse Wireless", qtd: 1, tipo: "Varejo", pgto: "Cartão", valor: "R$ 129,90", hora: "09:10", vendedor: "Mayara" },
  { id: "V-1242", produto: "Suporte Notebook", qtd: 2, tipo: "Varejo", pgto: "PIX", valor: "R$ 318,00", hora: "08:45", vendedor: "Meire" },
];

const SEMANA = [
  { dia: "Seg", valor: 3200 },
  { dia: "Ter", valor: 4280 },
  { dia: "Qua", valor: 2800 },
  { dia: "Qui", valor: 3600 },
  { dia: "Sex", valor: 5100 },
  { dia: "Sáb", valor: 4800 },
];

const PRODUTOS = [
  { nome: "Carregador USB-C 65W", preco: 189.90 },
  { nome: "Hub USB-C 7 em 1", preco: 179.00 },
  { nome: "Fone Bluetooth ANC", preco: 239.00 },
  { nome: "Cabo Type-C 2m", preco: 35.00 },
  { nome: "Mouse Wireless WiWU", preco: 129.90 },
  { nome: "Suporte Notebook", preco: 159.00 },
  { nome: "Powerbank 20000mAh", preco: 199.90 },
  { nome: 'Case MacBook 14"', preco: 149.00 },
];

const ABASTECIMENTO = [
  { secao: "A: Carregadores & Cabos", itens: [
    { nome: "Carregador 65W", ok: true },
    { nome: "Carregador 30W", ok: true },
    { nome: "Cabo Type-C 1m", ok: false },
    { nome: "Cabo Type-C 2m", ok: true },
    { nome: "Cabo Lightning", ok: false },
  ]},
  { secao: "B: Acessórios & Wearables", itens: [
    { nome: "Mouse Wireless", ok: true },
    { nome: "Suporte Notebook", ok: true },
    { nome: "Hub USB-C", ok: false },
    { nome: "Fone Bluetooth", ok: true },
    { nome: 'Case MacBook 14"', ok: false },
  ]},
];

/* ═══════════════════════════════════════════════ */
export default function VendasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Dashboard");

  useEffect(() => {
    if (status === "loading") return;
    const user = session?.user as any;
    const role = user?.role as string | undefined;
    const isGlobal = role === "SUPER" || role === "ADMIN";
    if (!isGlobal && user?.departmentSlug !== "vendas") {
      router.replace(user?.departmentSlug ? `/departments/${user.departmentSlug}` : "/departments");
    }
  }, [session, status, router]);

  if (status === "loading") return null;
  const [formProd, setFormProd] = useState("");
  const [formQtd, setFormQtd] = useState("1");
  const [formTipo, setFormTipo] = useState("Varejo");
  const [formPgto, setFormPgto] = useState("PIX");
  const [abastChecks, setAbastChecks] = useState<Record<string, boolean>>({});

  const maxBar = Math.max(...SEMANA.map((d) => d.valor));
  const selectedProd = PRODUTOS.find((p) => p.nome === formProd);
  const totalVenda = selectedProd ? selectedProd.preco * parseInt(formQtd || "0") : 0;

  return (
    <div className="animate-fade-in">
      {/* Tab nav */}
      <div className="flex items-center gap-1 mb-4 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-1 shadow-[var(--shadow-sm)]">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 rounded-[var(--radius-sm)] text-[12.5px] font-semibold transition-all cursor-pointer", activeTab === tab ? "bg-[var(--color-navy)] text-white shadow-sm" : "text-[var(--color-t2)] hover:bg-[var(--color-page)]")}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ──────────────── */}
      {activeTab === "Dashboard" && (
        <div className="space-y-4">
          {/* Hero */}
          <div className="bg-[var(--color-navy)] rounded-[var(--radius-md)] p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-1">Vendas Hoje</div>
            <div className="text-[42px] font-bold tracking-tight leading-none mb-1">R$ 4.280</div>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="text-white/60">Meta do dia: R$ 6.000</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-bold">71%</span>
            </div>
            {/* Ring progress */}
            <div className="absolute top-5 right-8">
              <svg width="70" height="70" viewBox="0 0 70 70">
                <circle cx="35" cy="35" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle cx="35" cy="35" r="28" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 28 * 0.71} ${2 * Math.PI * 28}`}
                  strokeLinecap="round" transform="rotate(-90 35 35)" />
                <text x="35" y="38" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">71%</text>
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Vendas hoje", value: "12", icon: ShoppingBag, color: "var(--color-navy)" },
              { label: "Ticket médio", value: "R$ 189", icon: TrendingUp, color: "var(--color-green)" },
              { label: "Meta mensal", value: "62%", icon: Target, color: "var(--color-amber)" },
              { label: "Ranking", value: "2º", icon: Award, color: "var(--color-purple)" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
                <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-2">{kpi.label}</div>
                <div className="text-[22px] font-bold text-[var(--color-t1)] tracking-tight">{kpi.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Bar chart */}
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-4">Vendas da Semana</h3>
              <div className="flex items-end gap-3 h-[120px]">
                {SEMANA.map((d, i) => (
                  <div key={d.dia} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[var(--color-t1)]">R$ {(d.valor / 1000).toFixed(1)}K</span>
                    <div
                      className={cn("w-full rounded-t-md transition-all", i === 1 ? "bg-[var(--color-navy)]" : "bg-[var(--color-navy)]/20")}
                      style={{ height: `${(d.valor / maxBar) * 100}%` }}
                    />
                    <span className={cn("text-[11px] font-semibold", i === 1 ? "text-[var(--color-navy)]" : "text-[var(--color-t3)]")}>{d.dia}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last sales */}
            <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-3">Últimas Vendas</h3>
              {VENDAS.slice(0, 4).map((v) => (
                <div key={v.id} className="flex items-center gap-2 py-2 border-b border-[var(--color-border)] last:border-b-0">
                  <span className="text-[12px] font-semibold text-[var(--color-t2)] flex-1">{v.produto}</span>
                  <span className="text-[12px] font-bold text-[var(--color-t1)]">{v.valor}</span>
                  <span className="text-[10.5px] text-[var(--color-t3)]">{v.hora}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTRAR VENDA ────────── */}
      {activeTab === "Registrar Venda" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-4">Nova Venda</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-t2)] uppercase tracking-wider mb-1">Produto</label>
                <select value={formProd} onChange={(e) => setFormProd(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] outline-none focus:border-[var(--color-navy)]">
                  <option value="">Selecionar produto...</option>
                  {PRODUTOS.map((p) => <option key={p.nome} value={p.nome}>{p.nome} — R$ {p.preco.toFixed(2)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-t2)] uppercase tracking-wider mb-1">Quantidade</label>
                  <input type="number" min="1" value={formQtd} onChange={(e) => setFormQtd(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] outline-none focus:border-[var(--color-navy)]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--color-t2)] uppercase tracking-wider mb-1">Tipo</label>
                  <select value={formTipo} onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] outline-none focus:border-[var(--color-navy)]">
                    <option>Varejo</option><option>Atacado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--color-t2)] uppercase tracking-wider mb-1">Pagamento</label>
                <div className="flex gap-2">
                  {["PIX", "Cartão", "Boleto", "Dinheiro"].map((p) => (
                    <button key={p} onClick={() => setFormPgto(p)}
                      className={cn("px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-semibold transition-all cursor-pointer border",
                        formPgto === p ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]" : "border-[var(--color-border)] text-[var(--color-t2)] hover:bg-[var(--color-page)]")}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button className="w-full mt-2 py-2.5 bg-[var(--color-navy)] text-white text-[13px] font-bold rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer">
                Registrar Venda
              </button>
            </div>
          </div>
          {/* Preview */}
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-4">Preview</h3>
            <div className="border border-[var(--color-border)] rounded-[var(--radius-sm)] p-4 bg-[var(--color-page)]">
              <div className="text-[12px] text-[var(--color-t3)] mb-2">Produto</div>
              <div className="text-[14px] font-bold text-[var(--color-t1)] mb-3">{formProd || "—"}</div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div><div className="text-[10px] text-[var(--color-t3)] uppercase">Qtd</div><div className="text-[14px] font-bold">{formQtd}</div></div>
                <div><div className="text-[10px] text-[var(--color-t3)] uppercase">Tipo</div><div className="text-[14px] font-bold">{formTipo}</div></div>
                <div><div className="text-[10px] text-[var(--color-t3)] uppercase">Pgto</div><div className="text-[14px] font-bold">{formPgto}</div></div>
              </div>
              <div className="border-t border-[var(--color-border)] pt-3">
                <div className="text-[10px] text-[var(--color-t3)] uppercase">Total</div>
                <div className="text-[28px] font-bold text-[var(--color-navy)] tracking-tight">
                  R$ {totalVenda.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTÓRICO ──────────────── */}
      {activeTab === "Histórico" && (
        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)]">Histórico de Vendas</h3>
            <div className="flex gap-1">
              {["Hoje", "Semana", "Mês"].map((f) => (
                <button key={f} className="px-3 py-1 text-[11px] font-semibold border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-t2)] hover:bg-[var(--color-page)] cursor-pointer">{f}</button>
              ))}
            </div>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-[var(--color-page)] border-b border-[var(--color-border)]">
                {["ID", "Produto", "Qtd", "Tipo", "Pagamento", "Valor", "Hora", "Vendedor"].map((h) => (
                  <th key={h} className="p-3 text-left text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VENDAS.map((v) => (
                <tr key={v.id} className="border-b border-[var(--color-border)] hover:bg-[#050A2D03]">
                  <td className="p-3 font-bold text-[var(--color-t1)]">{v.id}</td>
                  <td className="p-3 text-[var(--color-t2)]">{v.produto}</td>
                  <td className="p-3 text-center">{v.qtd}</td>
                  <td className="p-3"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", v.tipo === "Atacado" ? "bg-[var(--color-navy-light)] text-[var(--color-navy)]" : "bg-[var(--color-green-light)] text-[var(--color-green)]")}>{v.tipo}</span></td>
                  <td className="p-3 text-[var(--color-t2)]">{v.pgto}</td>
                  <td className="p-3 font-bold text-[var(--color-t1)]">{v.valor}</td>
                  <td className="p-3 text-[var(--color-t3)]">{v.hora}</td>
                  <td className="p-3 text-[var(--color-t2)]">{v.vendedor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── METAS ──────────────────── */}
      {activeTab === "Metas" && (
        <div className="space-y-4">
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-4">Meta Mensal — Março 2026</h3>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-[28px] font-bold text-[var(--color-t1)]">R$ 78.600</div>
                <div className="text-[12px] text-[var(--color-t3)]">de R$ 127.000</div>
              </div>
              <div className="flex-1">
                <div className="h-3 rounded-full bg-[var(--color-border)]">
                  <div className="h-3 rounded-full bg-[var(--color-navy)] transition-all" style={{ width: "62%" }} />
                </div>
                <div className="text-[11px] text-[var(--color-t3)] mt-1">62% concluído · 14 dias restantes</div>
              </div>
              <div className="text-[32px] font-bold text-[var(--color-navy)]">62%</div>
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-3">Ranking Semanal</h3>
            {[
              { pos: 1, nome: "Mayara", valor: "R$ 12.450", pct: 100, medal: "🥇" },
              { pos: 2, nome: "Meire", valor: "R$ 10.880", pct: 87, medal: "🥈" },
            ].map((r) => (
              <div key={r.pos} className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] last:border-b-0">
                <span className="text-lg">{r.medal}</span>
                <div className="w-8 h-8 rounded-full bg-[var(--color-navy)] text-white flex items-center justify-center text-[11px] font-bold">{r.nome[0]}{r.nome[1]?.toUpperCase()}</div>
                <span className="text-[13px] font-bold text-[var(--color-t1)] flex-1">{r.nome}</span>
                <span className="text-[13px] font-bold text-[var(--color-navy)]">{r.valor}</span>
                <div className="w-24 h-[6px] rounded bg-[var(--color-border)]">
                  <div className="h-[6px] rounded bg-[var(--color-navy)]" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABASTECIMENTO ──────────── */}
      {activeTab === "Abastecimento" && (
        <div className="space-y-4">
          {ABASTECIMENTO.map((sec) => (
            <div key={sec.secao} className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
              <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-3">{sec.secao}</h3>
              <div className="flex flex-col gap-1.5">
                {sec.itens.map((item) => {
                  const key = sec.secao + item.nome;
                  const checked = abastChecks[key] ?? item.ok;
                  return (
                    <button key={item.nome} onClick={() => setAbastChecks((p) => ({ ...p, [key]: !checked }))}
                      className={cn("flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer text-left",
                        checked ? "bg-[var(--color-green-light)] border-[var(--color-green)]" : "bg-white border-[var(--color-border)] hover:bg-[var(--color-page)]")}>
                      <div className={cn("w-5 h-5 rounded flex items-center justify-center text-[10px]", checked ? "bg-[var(--color-green)] text-white" : "border-[1.5px] border-[var(--color-border)]")}>
                        {checked && <Check className="w-3 h-3" />}
                      </div>
                      <span className={cn("text-[12.5px] font-semibold", checked ? "text-[var(--color-green)]" : "text-[var(--color-t1)]")}>{item.nome}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RELATÓRIOS ─────────────── */}
      {activeTab === "Relatórios" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Faturamento mês", value: "R$ 78.6K", delta: "+8% vs fev" },
              { label: "Vendas realizadas", value: "412", delta: "+15% vs fev" },
              { label: "Ticket médio", value: "R$ 190,78", delta: "+12% vs fev" },
            ].map((k) => (
              <div key={k.label} className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
                <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-1">{k.label}</div>
                <div className="text-[22px] font-bold text-[var(--color-t1)]">{k.value}</div>
                <div className="text-[11px] font-semibold text-[var(--color-green)] mt-1">{k.delta}</div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-sm)]">
            <h3 className="text-[13px] font-bold text-[var(--color-t1)] mb-4">Distribuição por Categoria</h3>
            <div className="space-y-3">
              {[
                { cat: "Carregadores", pct: 32, valor: "R$ 25.2K" },
                { cat: "Acessórios", pct: 24, valor: "R$ 18.9K" },
                { cat: "Áudio", pct: 18, valor: "R$ 14.1K" },
                { cat: "Conectividade", pct: 15, valor: "R$ 11.8K" },
                { cat: "Outros", pct: 11, valor: "R$ 8.6K" },
              ].map((c) => (
                <div key={c.cat} className="flex items-center gap-3">
                  <span className="text-[12px] font-semibold text-[var(--color-t1)] w-28">{c.cat}</span>
                  <div className="flex-1 h-[8px] rounded bg-[var(--color-border)]">
                    <div className="h-[8px] rounded bg-[var(--color-navy)] transition-all" style={{ width: `${c.pct}%` }} />
                  </div>
                  <span className="text-[12px] font-bold text-[var(--color-t1)] w-16 text-right">{c.valor}</span>
                  <span className="text-[11px] text-[var(--color-t3)] w-8">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
