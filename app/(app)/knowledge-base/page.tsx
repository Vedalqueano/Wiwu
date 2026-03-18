"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { canAccess } from "@/lib/rbac";
import {
  BookOpen, Search, ChevronRight, Plus, FileText,
  Clock, Tag, CheckCircle2, XCircle, Edit2, X, Save,
  ChevronLeft,
} from "lucide-react";

type Policy = {
  id: string;
  title: string;
  slug: string;
  content: string;
  version: number;
  published: boolean;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
  department: { id: string; name: string; color: string };
};

// Renderer markdown simples (sem dependências externas)
function MarkdownView({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-[14px] font-bold text-[var(--color-t1)] mt-5 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-[16px] font-bold text-[var(--color-t1)] mt-6 mb-2 pb-1.5 border-b border-[var(--color-border)]">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-[18px] font-bold text-[var(--color-t1)] mt-4 mb-3">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="flex flex-col gap-1 my-2 pl-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-[13px] text-[var(--color-t2)]">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--color-navy)] shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
        num++;
      }
      elements.push(
        <ol key={i} className="flex flex-col gap-1 my-2 pl-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-[13px] text-[var(--color-t2)]">
              <span className="mt-0.5 text-[11px] font-bold text-[var(--color-navy)] w-4 shrink-0">{j + 1}.</span>
              <span dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="my-3 bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 overflow-x-auto">
          <code className="text-[12px] font-mono text-[var(--color-t1)]">{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="my-2 pl-3 border-l-[3px] border-[var(--color-navy)] bg-[var(--color-navy-light)] rounded-r py-1.5 pr-3">
          <span className="text-[13px] text-[var(--color-t2)]" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2)) }} />
        </blockquote>
      );
    } else if (line.trim() === "" || line.trim() === "---") {
      if (line.trim() === "---") {
        elements.push(<hr key={i} className="my-4 border-[var(--color-border)]" />);
      } else {
        elements.push(<div key={i} className="h-2" />);
      }
    } else {
      elements.push(
        <p key={i} className="text-[13px] text-[var(--color-t2)] leading-relaxed my-1"
          dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />
      );
    }
    i++;
  }

  return <div className="prose-custom">{elements}</div>;
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[var(--color-t1)]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[var(--color-page)] border border-[var(--color-border)] rounded px-1 py-0.5 text-[11px] font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--color-navy)] underline hover:opacity-80" target="_blank">$1</a>');
}

// Modal de criação/edição
function PolicyModal({
  open,
  onClose,
  onSave,
  departments,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; departmentId: string; published: boolean }) => void;
  departments: { id: string; name: string }[];
  initial?: Partial<Policy>;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || TEMPLATE);
  const [departmentId, setDepartmentId] = useState(initial?.departmentId || departments[0]?.id || "");
  const [published, setPublished] = useState(initial?.published ?? false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setContent(initial?.content || TEMPLATE);
      setDepartmentId(initial?.departmentId || departments[0]?.id || "");
      setPublished(initial?.published ?? false);
      setPreview(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] w-full max-w-[760px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
          <h2 className="text-[14px] font-bold text-[var(--color-t1)]">
            {initial?.id ? "Editar Política" : "Nova Política / SOP"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--color-page)] cursor-pointer">
            <X className="w-4 h-4 text-[var(--color-t3)]" />
          </button>
        </div>

        {/* Fields */}
        <div className="px-5 pt-4 pb-2 flex gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do documento..."
            className="flex-1 px-3 py-2 text-[13px] border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-navy)] bg-white"
          />
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-3 py-2 text-[13px] border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-navy)] bg-white cursor-pointer"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Tabs editor/preview */}
        <div className="px-5 pb-2 flex gap-0.5">
          {["editor", "preview"].map((tab) => (
            <button
              key={tab}
              onClick={() => setPreview(tab === "preview")}
              className={cn(
                "px-3 py-1.5 text-[12px] font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer",
                (tab === "preview") === preview
                  ? "bg-[var(--color-navy-light)] text-[var(--color-navy)]"
                  : "text-[var(--color-t3)] hover:bg-[var(--color-page)]"
              )}
            >
              {tab === "editor" ? "Editor" : "Visualização"}
            </button>
          ))}
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 overflow-hidden px-5 pb-2">
          {!preview ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[280px] px-3 py-2.5 text-[13px] font-mono border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-navy)] bg-[var(--color-page)] resize-none"
              spellCheck={false}
            />
          ) : (
            <div className="h-full overflow-y-auto border border-[var(--color-border)] rounded-[var(--radius-sm)] p-4 bg-white">
              <MarkdownView content={content} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setPublished(!published)}
              className={cn(
                "w-9 h-5 rounded-full relative transition-colors cursor-pointer",
                published ? "bg-[var(--color-navy)]" : "bg-[var(--color-border)]"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all",
                published ? "left-[18px]" : "left-0.5"
              )} />
            </div>
            <span className="text-[12.5px] text-[var(--color-t2)]">
              {published ? "Publicado" : "Rascunho"}
            </span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--radius-sm)] text-[12.5px] text-[var(--color-t2)] hover:bg-[var(--color-page)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave({ title, content, departmentId, published })}
              disabled={!title.trim() || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-navy)] text-white rounded-[var(--radius-sm)] text-[12.5px] font-bold hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TEMPLATE = `# Título do Processo

## Objetivo
Descreva o objetivo deste processo ou política.

## Responsáveis
- Fulano de Tal — Responsável principal
- Ciclano — Backup

## Passo a Passo

1. Primeiro passo do processo
2. Segundo passo
3. Terceiro passo

## Observações

> Inclua aqui informações importantes ou avisos especiais.

---

**Última revisão:** $(data)
`;

export default function KnowledgeBasePage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const canEdit = canAccess(user?.role, "MANAGER");

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selected, setSelected] = useState<Policy | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Policy | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const res = await fetch(`/api/policies`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPolicies(data);
        // Extrair departamentos únicos
        const deptMap = new Map<string, { id: string; name: string; color: string }>();
        data.forEach((p: Policy) => {
          if (!deptMap.has(p.department.id)) deptMap.set(p.department.id, p.department);
        });
        setDepartments(Array.from(deptMap.values()));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const filtered = policies.filter((p) => {
    const matchDept = !selectedDept || p.departmentId === selectedDept;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  const handleSave = async (data: { title: string; content: string; departmentId: string; published: boolean }) => {
    if (editing) {
      await fetch("/api/policies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...data }),
      });
    } else {
      await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setModalOpen(false);
    setEditing(null);
    await fetchPolicies();
  };

  // Buscar lista de departamentos para o modal (todos, inclusive sem policies)
  const [allDepts, setAllDepts] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/departments").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAllDepts(data);
    }).catch(() => {});
  }, []);

  const modalDepts = allDepts.length > 0 ? allDepts : departments;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="flex h-full -m-[22px] animate-fade-in">
      {/* Sidebar esquerda */}
      <div className="w-[260px] bg-white border-r border-[var(--color-border)] flex flex-col shrink-0">
        <div className="p-3.5 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-bold text-[var(--color-t1)]">Knowledge Base</h2>
            {canEdit && (
              <button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="w-6 h-6 rounded flex items-center justify-center bg-[var(--color-navy)] text-white hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer"
                title="Nova política"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-t3)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar documentos..."
              className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-navy)]"
            />
          </div>
        </div>

        {/* Filtro por departamento */}
        <div className="px-3 py-2 border-b border-[var(--color-border)] flex flex-col gap-0.5">
          <button
            onClick={() => setSelectedDept(null)}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded-[var(--radius-sm)] text-[12px] transition-colors cursor-pointer",
              !selectedDept ? "bg-[var(--color-navy-light)] text-[var(--color-navy)] font-semibold" : "text-[var(--color-t2)] hover:bg-[var(--color-page)]"
            )}
          >
            Todos os departamentos
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id === selectedDept ? null : d.id)}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-[var(--radius-sm)] text-[12px] flex items-center gap-2 transition-colors cursor-pointer",
                selectedDept === d.id ? "bg-[var(--color-navy-light)] text-[var(--color-navy)] font-semibold" : "text-[var(--color-t2)] hover:bg-[var(--color-page)]"
              )}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              {d.name}
            </button>
          ))}
        </div>

        {/* Lista de políticas */}
        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[var(--color-navy)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-[var(--color-border)] mx-auto mb-2" />
              <p className="text-[12px] text-[var(--color-t3)]">
                {search ? "Nenhum resultado" : "Nenhum documento publicado"}
              </p>
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={cn(
                  "w-full text-left px-3 py-2.5 mx-1 rounded-[var(--radius-sm)] transition-all cursor-pointer border-l-[2px]",
                  "hover:bg-[var(--color-page)]",
                  selected?.id === p.id
                    ? "bg-[var(--color-navy-light)] border-[var(--color-navy)]"
                    : "border-transparent"
                )}
                style={{ width: "calc(100% - 8px)" }}
              >
                <div className="flex items-start gap-2">
                  <FileText className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", selected?.id === p.id ? "text-[var(--color-navy)]" : "text-[var(--color-t3)]")} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-[12.5px] leading-snug", selected?.id === p.id ? "font-bold text-[var(--color-t1)]" : "font-medium text-[var(--color-t2)]")}>
                      {p.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[var(--color-t3)]">{p.department.name}</span>
                      <span className="text-[10px] text-[var(--color-t3)]">·</span>
                      <span className="text-[10px] text-[var(--color-t3)]">v{p.version}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Contagem */}
        {!loading && (
          <div className="px-3 py-2 border-t border-[var(--color-border)]">
            <p className="text-[10.5px] text-[var(--color-t3)]">{filtered.length} documento{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-page)]">
        {selected ? (
          <>
            {/* Header da policy */}
            <div className="bg-white border-b border-[var(--color-border)] px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => setSelected(null)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-[var(--color-page)] transition-colors cursor-pointer md:hidden"
                    >
                      <ChevronLeft className="w-4 h-4 text-[var(--color-t3)]" />
                    </button>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: selected.department.color }} />
                      <span className="text-[11px] font-semibold text-[var(--color-t3)] uppercase tracking-wide">{selected.department.name}</span>
                    </div>
                    {selected.published ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-green-light)] text-[var(--color-green)]">
                        <CheckCircle2 className="w-3 h-3" /> Publicado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-border)] text-[var(--color-t3)]">
                        <XCircle className="w-3 h-3" /> Rascunho
                      </span>
                    )}
                  </div>
                  <h1 className="text-[17px] font-bold text-[var(--color-t1)]">{selected.title}</h1>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-[11px] text-[var(--color-t3)]">
                      <Tag className="w-3 h-3" /> v{selected.version}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--color-t3)]">
                      <Clock className="w-3 h-3" /> Atualizado {formatDate(selected.updatedAt)}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => { setEditing(selected); setModalOpen(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-[12px] font-semibold border border-[var(--color-border)] hover:bg-[var(--color-page)] transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[var(--color-t3)]" /> Editar
                  </button>
                )}
              </div>
            </div>

            {/* Conteúdo markdown */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-[760px] mx-auto px-6 py-6">
                <div className="bg-white rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-6 md:p-8">
                  <MarkdownView content={selected.content} />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-[320px]">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-navy)] flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-[15px] font-bold text-[var(--color-t1)] mb-1">Knowledge Base</h2>
              <p className="text-[13px] text-[var(--color-t3)] leading-relaxed">
                Selecione um documento na lista à esquerda para visualizar seu conteúdo.
              </p>
              {canEdit && (
                <button
                  onClick={() => { setEditing(null); setModalOpen(true); }}
                  className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-[var(--color-navy)] text-white rounded-[var(--radius-sm)] text-[13px] font-bold hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Nova Política
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      <PolicyModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        departments={modalDepts}
        initial={editing ?? undefined}
      />
    </div>
  );
}
