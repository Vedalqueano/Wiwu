"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";

/* ── Departamentos (carregados localmente por simplicidade) ── */
const DEPARTMENTS = [
  { id: "logistica", name: "Logística", color: "#E6141E", icon: "📦" },
  { id: "vendas", name: "Vendas / Loja", color: "#7DAA4A", icon: "🏪" },
  { id: "sac", name: "SAC", color: "#1A3A8F", icon: "🎧" },
  { id: "marketing", name: "Marketing", color: "#B84870", icon: "📢" },
  { id: "financeiro", name: "Financeiro", color: "#C9881A", icon: "💰" },
  { id: "ti", name: "TI", color: "#6B3FA0", icon: "💻" },
];

const DEPT_MSGS: Record<string, string> = {
  logistica: "Seu painel de Logística está pronto.",
  vendas: "Boas vendas para hoje!",
  sac: "Seus atendimentos estão esperando.",
  marketing: "Novas campanhas aguardam.",
  financeiro: "Relatórios prontos para análise.",
  ti: "Sistemas em dia.",
};

type Step = "identify" | "department" | "password" | "welcome";

type UserInfo = {
  name: string;
  initials: string;
  color: string;
  role: string;
  departmentSlug: string;
  departmentName: string;
};

export default function LoginPage() {
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  /* ── Step 1: Verificar se usuário existe via API ── */
  const handleIdentify = async () => {
    const login = identifier.trim().toLowerCase();
    if (!login) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setSelectedDept(data.departmentSlug || "");
        setStep("department");
      } else {
        setError("Usuário não encontrado.");
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3: Login real via NextAuth ── */
  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      login: identifier.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Senha incorreta.");
      setLoading(false);
    } else {
      setStep("welcome");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-[400px] px-6 animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
          <span className="text-2xl font-bold text-white">W</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">WiWU Flow</h1>
        <p className="text-sm text-white/40 mt-1">Plataforma de gestão interna</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-[14px] p-7 shadow-[var(--shadow-modal)]">
        {/* ── Step 1: Identify ── */}
        {step === "identify" && (
          <div className="animate-fade-in">
            <h2 className="text-[15px] font-bold text-[var(--color-t1)] mb-1">Entrar na plataforma</h2>
            <p className="text-xs text-[var(--color-t3)] mb-6">Use seu e-mail corporativo ou matrícula</p>
            <label className="block text-[10px] font-bold text-[var(--color-t2)] uppercase tracking-wider mb-1.5">
              E-mail ou matrícula
            </label>
            <input
              type="text"
              className="w-full px-3 py-2.5 bg-[var(--color-page)] border-[1.5px] border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--color-t1)] outline-none focus:border-[var(--color-navy)] focus:bg-white focus:shadow-[0_0_0_3px_#050A2D08] transition-all placeholder:text-[var(--color-t3)]"
              placeholder="vitoria@wiwu.com.br ou 001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleIdentify()}
              disabled={loading}
            />
            {error && <p className="text-xs text-[var(--color-red)] mt-2 font-semibold">{error}</p>}
            <button
              onClick={handleIdentify}
              disabled={loading}
              className="w-full mt-5 py-2.5 bg-[var(--color-navy)] text-white text-[13px] font-bold rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Continuar"}
            </button>
          </div>
        )}

        {/* ── Step 2: Department ── */}
        {step === "department" && (
          <div className="animate-fade-in">
            <h2 className="text-[15px] font-bold text-[var(--color-t1)] mb-1">
              Olá, {user?.name}! 👋
            </h2>
            <p className="text-xs text-[var(--color-t3)] mb-5">Selecione seu departamento</p>
            <div className="flex flex-col gap-2 mb-5">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDept(d.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border transition-all cursor-pointer text-left",
                    selectedDept === d.id
                      ? "border-[var(--color-navy)] bg-[var(--color-navy-light)] shadow-[0_0_0_3px_#050A2D08]"
                      : "border-[var(--color-border)] hover:bg-[var(--color-page)]"
                  )}
                >
                  <span className="text-lg">{d.icon}</span>
                  <span className={cn("text-[13px] font-semibold", selectedDept === d.id ? "text-[var(--color-navy)]" : "text-[var(--color-t2)]")}>
                    {d.name}
                  </span>
                  {selectedDept === d.id && (
                    <svg className="ml-auto w-4 h-4 text-[var(--color-navy)]" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => { if (selectedDept) { setError(""); setStep("password"); } }}
              className="w-full py-2.5 bg-[var(--color-navy)] text-white text-[13px] font-bold rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer"
            >
              Continuar
            </button>
            <button
              onClick={() => { setStep("identify"); setError(""); }}
              className="w-full mt-2 py-2 text-[12px] text-[var(--color-t3)] hover:text-[var(--color-t2)] transition-colors cursor-pointer"
            >
              ← Voltar
            </button>
          </div>
        )}

        {/* ── Step 3: Password ── */}
        {step === "password" && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ background: user?.color }}
              >
                {user?.initials}
              </div>
              <div>
                <div className="text-[13px] font-bold text-[var(--color-t1)]">{user?.name}</div>
                <div className="text-[11px] text-[var(--color-t3)]">{user?.role} · {user?.departmentName}</div>
              </div>
            </div>
            <label className="block text-[10px] font-bold text-[var(--color-t2)] uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <input
              type="password"
              className="w-full px-3 py-2.5 bg-[var(--color-page)] border-[1.5px] border-[var(--color-border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--color-t1)] outline-none focus:border-[var(--color-navy)] focus:bg-white focus:shadow-[0_0_0_3px_#050A2D08] transition-all placeholder:text-[var(--color-t3)]"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              autoFocus
              disabled={loading}
            />
            {error && <p className="text-xs text-[var(--color-red)] mt-2 font-semibold">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-5 py-2.5 bg-[var(--color-navy)] text-white text-[13px] font-bold rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <button
              onClick={() => { setStep("department"); setError(""); setPassword(""); }}
              className="w-full mt-2 py-2 text-[12px] text-[var(--color-t3)] hover:text-[var(--color-t2)] transition-colors cursor-pointer"
            >
              ← Voltar
            </button>
          </div>
        )}

        {/* ── Step 4: Welcome ── */}
        {step === "welcome" && (
          <div className="animate-fade-in text-center py-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-4"
              style={{ background: user?.color }}
            >
              {user?.initials}
            </div>
            <h2 className="text-[18px] font-bold text-[var(--color-t1)] mb-1">
              Bem-vindo(a), {user?.name}! 🚀
            </h2>
            <p className="text-[13px] text-[var(--color-t3)] mb-2">
              {DEPT_MSGS[selectedDept] || "Sua plataforma está pronta."}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-2 h-2 rounded-full bg-[var(--color-navy)] animate-pulse"></div>
              <span className="text-[12px] text-[var(--color-t3)]">Carregando sua área...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-[11px] text-white/25 mt-6">
        WiWU Flow © 2026 · flow.wiwu.com.br
      </p>
    </div>
  );
}
