"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { GripVertical, Plus, Calendar, Flag, Loader2 } from "lucide-react";

type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";
type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

interface TaskData {
  id: string; title: string; priority: TaskPriority; status: TaskStatus;
  assigneeName: string | null; assigneeInitials: string | null; assigneeColor: string | null;
  creatorName: string; dueDate: string | null;
}

const COLUMNS: { id: TaskStatus; label: string; dotColor: string }[] = [
  { id: "TODO", label: "A Fazer", dotColor: "bg-[var(--color-t3)]" },
  { id: "IN_PROGRESS", label: "Fazendo", dotColor: "bg-[var(--color-blue)]" },
  { id: "REVIEW", label: "Revisão", dotColor: "bg-[var(--color-amber)]" },
  { id: "DONE", label: "Concluído", dotColor: "bg-[var(--color-green)]" },
];

const PRIORITY_MAP: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  URGENT: { label: "Urgente", color: "text-[var(--color-red)]", bg: "bg-[var(--color-red-light)]" },
  HIGH: { label: "Alta", color: "text-[var(--color-amber)]", bg: "bg-[var(--color-amber-light)]" },
  MEDIUM: { label: "Média", color: "text-[var(--color-blue)]", bg: "bg-[var(--color-blue-light)]" },
  LOW: { label: "Baixa", color: "text-[var(--color-green)]", bg: "bg-[var(--color-green-light)]" },
};

function TaskCard({ task, onMove }: { task: TaskData; onMove: (id: string, to: TaskStatus) => void }) {
  const p = PRIORITY_MAP[task.priority];
  const nextStatus: Record<TaskStatus, TaskStatus> = { TODO: "IN_PROGRESS", IN_PROGRESS: "REVIEW", REVIEW: "DONE", DONE: "DONE" };

  return (
    <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-sm)] p-3 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow group cursor-pointer"
      onClick={() => task.status !== "DONE" && onMove(task.id, nextStatus[task.status])}>
      <div className="flex items-start gap-1.5 mb-2">
        <GripVertical className="w-3.5 h-3.5 text-[var(--color-border-2)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
        <span className="text-[12.5px] font-semibold text-[var(--color-t1)] leading-tight flex-1">{task.title}</span>
      </div>
      <div className="flex items-center gap-2 ml-5">
        <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold", p.bg, p.color)}>
          <Flag className="w-2.5 h-2.5" /> {p.label}
        </span>
        {task.dueDate && (
          <span className="inline-flex items-center gap-0.5 text-[10.5px] text-[var(--color-t3)]">
            <Calendar className="w-2.5 h-2.5" /> {new Date(task.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
        )}
        {task.assigneeInitials && (
          <div className="ml-auto">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: task.assigneeColor || "#050A2D" }} title={task.assigneeName || ""}>
              {task.assigneeInitials}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks").then((r) => r.json()).then(setTasks).catch(console.error).finally(() => setLoading(false));
  }, []);

  const moveTask = async (id: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: newStatus } : t));
    try {
      await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: newStatus }) });
    } catch (e) { console.error(e); }
  };

  const tasksByCol = (col: TaskStatus) => tasks.filter((t) => t.status === col);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-[var(--color-navy)] animate-spin" /><span className="ml-2 text-[13px] text-[var(--color-t3)]">Carregando tarefas...</span></div>;

  return (
    <div className="animate-fade-in h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-[var(--color-t1)]">Quadro de Tarefas</h2>
          <p className="text-[12px] text-[var(--color-t3)]">{tasks.length} tarefas · {tasksByCol("DONE").length} concluídas</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-navy)] text-white text-[12px] font-bold rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Nova tarefa
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 h-[calc(100%-60px)]">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex flex-col bg-[var(--color-page)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--color-border)]">
              <div className={cn("w-2 h-2 rounded-full", col.dotColor)} />
              <span className="text-[12px] font-bold text-[var(--color-t1)]">{col.label}</span>
              <span className="ml-auto text-[11px] font-bold text-[var(--color-t3)] bg-[var(--color-border)] w-5 h-5 rounded-full flex items-center justify-center">{tasksByCol(col.id).length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
              {tasksByCol(col.id).map((task) => (
                <TaskCard key={task.id} task={task} onMove={moveTask} />
              ))}
              <button className="flex items-center justify-center gap-1 py-2 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] text-[11px] text-[var(--color-t3)] hover:bg-white hover:border-[var(--color-border-2)] transition-colors cursor-pointer">
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
