"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search, X, Users, CheckSquare, MessageSquare, BookOpen,
  Loader2, Hash,
} from "lucide-react";

type SearchResults = {
  members: {
    id: string; name: string; email: string;
    initials: string; color: string; role: string;
    department: { name: string } | null;
  }[];
  tasks: {
    id: string; title: string; status: string; priority: string;
    assignee: { name: string; initials: string; color: string } | null;
  }[];
  messages: {
    id: string; content: string; createdAt: string; channelId: string;
    channel: { name: string; slug: string };
    user: { name: string; initials: string; color: string };
  }[];
  policies: {
    id: string; title: string; version: number;
    department: { name: string; color: string };
  }[];
};

const STATUS_LABEL: Record<string, string> = {
  TODO: "A fazer", IN_PROGRESS: "Em progresso", REVIEW: "Revisão", DONE: "Concluído",
};
const PRIORITY_COLOR: Record<string, string> = {
  LOW: "text-[var(--color-t3)]", MEDIUM: "text-[var(--color-navy)]",
  HIGH: "text-[var(--color-orange)]", URGENT: "text-[var(--color-red)]",
};

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focar input quando abre
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 280);
  };

  const navigate = (href: string) => {
    onClose();
    router.push(href);
  };

  const total = results
    ? results.members.length + results.tasks.length + results.messages.length + results.policies.length
    : 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] w-full max-w-[580px] overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-border)]">
          {loading
            ? <Loader2 className="w-4 h-4 text-[var(--color-t3)] animate-spin shrink-0" />
            : <Search className="w-4 h-4 text-[var(--color-t3)] shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            placeholder="Buscar mensagens, tarefas, membros, documentos..."
            className="flex-1 text-[13.5px] text-[var(--color-t1)] bg-transparent outline-none placeholder:text-[var(--color-t3)]"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}
              className="w-5 h-5 rounded flex items-center justify-center hover:bg-[var(--color-page)] transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5 text-[var(--color-t3)]" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[10px] font-mono text-[var(--color-t3)] bg-[var(--color-page)]">
            Esc
          </kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-[480px] overflow-y-auto">
          {!query && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="w-8 h-8 text-[var(--color-border)] mb-3" />
              <p className="text-[13px] font-semibold text-[var(--color-t2)]">Busca global</p>
              <p className="text-[12px] text-[var(--color-t3)] mt-1">Mensagens, tarefas, membros e documentos</p>
              <div className="flex items-center gap-1.5 mt-3">
                <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[10px] font-mono text-[var(--color-t3)] bg-[var(--color-page)]">Ctrl</kbd>
                <span className="text-[10px] text-[var(--color-t3)]">+</span>
                <kbd className="px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[10px] font-mono text-[var(--color-t3)] bg-[var(--color-page)]">K</kbd>
                <span className="text-[11px] text-[var(--color-t3)] ml-1">para abrir a qualquer momento</span>
              </div>
            </div>
          )}

          {query.length === 1 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-[12px] text-[var(--color-t3)]">Continue digitando para buscar...</p>
            </div>
          )}

          {results && total === 0 && (
            <div className="flex items-center justify-center py-8">
              <p className="text-[12px] text-[var(--color-t3)]">Nenhum resultado para "<strong>{query}</strong>"</p>
            </div>
          )}

          {results && total > 0 && (
            <div className="py-1">
              {/* Membros */}
              {results.members.length > 0 && (
                <Section label="Membros" icon={Users}>
                  {results.members.map((m) => (
                    <ResultItem
                      key={m.id}
                      onClick={() => navigate("/people")}
                      left={
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{ background: m.color }}>
                          {m.initials}
                        </div>
                      }
                      title={m.name}
                      subtitle={`${m.department?.name || "—"} · ${m.role}`}
                    />
                  ))}
                </Section>
              )}

              {/* Tarefas */}
              {results.tasks.length > 0 && (
                <Section label="Tarefas" icon={CheckSquare}>
                  {results.tasks.map((t) => (
                    <ResultItem
                      key={t.id}
                      onClick={() => navigate("/dashboard")}
                      left={
                        <div className="w-7 h-7 rounded-lg bg-[var(--color-page)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                          <CheckSquare className="w-3.5 h-3.5 text-[var(--color-t3)]" />
                        </div>
                      }
                      title={t.title}
                      subtitle={
                        <span className="flex items-center gap-1.5">
                          <span className={cn("text-[10px] font-bold", PRIORITY_COLOR[t.priority])}>{t.priority}</span>
                          <span className="text-[var(--color-t3)]">·</span>
                          <span>{STATUS_LABEL[t.status] || t.status}</span>
                          {t.assignee && <><span className="text-[var(--color-t3)]">·</span><span>{t.assignee.name}</span></>}
                        </span>
                      }
                    />
                  ))}
                </Section>
              )}

              {/* Mensagens */}
              {results.messages.length > 0 && (
                <Section label="Mensagens" icon={MessageSquare}>
                  {results.messages.map((msg) => (
                    <ResultItem
                      key={msg.id}
                      onClick={() => navigate("/channels")}
                      left={
                        <div className="w-7 h-7 rounded-lg bg-[var(--color-page)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                          <Hash className="w-3.5 h-3.5 text-[var(--color-t3)]" />
                        </div>
                      }
                      title={
                        <span>
                          <span className="text-[var(--color-t3)] font-normal">#{msg.channel.name} · </span>
                          {msg.user.name}
                        </span>
                      }
                      subtitle={
                        <span className="truncate block max-w-[380px]">
                          {msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content}
                        </span>
                      }
                    />
                  ))}
                </Section>
              )}

              {/* Políticas */}
              {results.policies.length > 0 && (
                <Section label="Processos" icon={BookOpen}>
                  {results.policies.map((p) => (
                    <ResultItem
                      key={p.id}
                      onClick={() => navigate("/knowledge-base")}
                      left={
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: p.department.color + "20" }}>
                          <BookOpen className="w-3.5 h-3.5" style={{ color: p.department.color }} />
                        </div>
                      }
                      title={p.title}
                      subtitle={`${p.department.name} · v${p.version}`}
                    />
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {results && total > 0 && (
          <div className="px-4 py-2 border-t border-[var(--color-border)] flex items-center justify-between">
            <p className="text-[11px] text-[var(--color-t3)]">{total} resultado{total !== 1 ? "s" : ""}</p>
            <p className="text-[11px] text-[var(--color-t3)]">
              Clique para navegar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  label, icon: Icon, children,
}: {
  label: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
        <Icon className="w-3 h-3 text-[var(--color-t3)]" />
        <span className="text-[10.5px] font-bold text-[var(--color-t3)] uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  );
}

function ResultItem({
  left, title, subtitle, onClick,
}: {
  left: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[var(--color-page)] transition-colors cursor-pointer text-left"
    >
      {left}
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-[var(--color-t1)] truncate">{title}</div>
        <div className="text-[11px] text-[var(--color-t3)] truncate">{subtitle}</div>
      </div>
    </button>
  );
}
