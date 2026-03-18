"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import { Search, MessageSquare, Send, Loader2 } from "lucide-react";

type Member = { id: string; name: string; email: string; initials: string; color: string; role: string; presence: string; departmentName: string; departmentSlug: string; lastSeen: string | null };
type DmMessage = { id: string; content: string; channelId: string; channelName: string; userId: string; userName: string; userInitials: string; userColor: string; userPresence: string; reactions: { emoji: string; userName: string }[]; createdAt: string };

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ONLINE: { label: "Online", color: "bg-[var(--color-online)]" },
  AWAY: { label: "Ausente", color: "bg-[var(--color-amber)]" },
  OFFLINE: { label: "Offline", color: "bg-[var(--color-border-2)]" },
};

const ROLE_MAP: Record<string, string> = { SUPER: "Super Admin", ADMIN: "Admin", MANAGER: "Gerente", EMPLOYEE: "Funcionário", VIEWER: "Visualizador" };

export default function PeoplePage() {
  const { data: session } = useSession();
  const myId = (session?.user as any)?.id as string | undefined;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [dmChannelId, setDmChannelId] = useState("");
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [dmInput, setDmInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const msgEnd = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/members").then((r) => r.json()).then(setMembers).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [dmMessages]);

  const handleNewMessage = useCallback((msg: DmMessage) => {
    if (msg.channelId !== dmChannelId) return;
    setDmMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, [dmChannelId]);

  const handleUserTyping = useCallback((userName: string) => setTypingUser(userName), []);
  const handleUserStopTyping = useCallback(() => setTypingUser(null), []);

  const { emitTyping, emitStopTyping } = useSocket(
    dmChannelId,
    handleNewMessage,
    handleUserTyping,
    handleUserStopTyping
  );

  const handleSelectMember = async (member: Member) => {
    if (!myId || member.id === myId) return;
    setSelected(member);
    setDmMessages([]);
    setDmChannelId("");
    setDmLoading(true);
    try {
      const res = await fetch("/api/dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ myId, otherId: member.id }),
      });
      const data = await res.json();
      setDmChannelId(data.channelId);
      setDmMessages(data.messages);
    } catch (e) { console.error(e); }
    finally { setDmLoading(false); }
  };

  const handleSend = async () => {
    if (!dmInput.trim() || !dmChannelId || !myId || sending) return;
    setSending(true);
    emitStopTyping();
    if (typingTimer.current) clearTimeout(typingTimer.current);
    const content = dmInput;
    setDmInput("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, channelId: dmChannelId, userId: myId }),
      });
      if (res.ok) {
        const saved = await res.json();
        // Remetente vê via API. Socket entrega para o destinatário.
        setDmMessages((prev) => {
          if (prev.find((m) => m.id === saved.id)) return prev;
          return [...prev, saved];
        });
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDmInput(e.target.value);
    const userName = session?.user?.name || "Alguém";
    emitTyping(userName);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(), 2000);
  };

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.departmentName.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );
  const byStatus = (status: string) => filtered.filter((m) => m.presence === status);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-[var(--color-navy)] animate-spin" /><span className="ml-2 text-[13px] text-[var(--color-t3)]">Carregando membros...</span></div>;

  return (
    <div className="flex h-full -m-[22px] animate-fade-in">
      {/* Lista de membros */}
      <div className="w-[280px] bg-white border-r border-[var(--color-border)] flex flex-col shrink-0">
        <div className="p-3.5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-sm)]">
            <Search className="w-3.5 h-3.5 text-[var(--color-t3)]" />
            <input type="text" className="flex-1 bg-transparent text-[12px] text-[var(--color-t1)] outline-none placeholder:text-[var(--color-t3)]" placeholder="Buscar membro..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1.5">
          {["ONLINE", "AWAY", "OFFLINE"].map((status) => {
            const list = byStatus(status);
            if (list.length === 0) return null;
            return (
              <div key={status}>
                <div className="px-3.5 pt-2 pb-1 text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider">
                  {STATUS_MAP[status]?.label || status} — {list.length}
                </div>
                {list.map((m) => (
                  <button key={m.id} onClick={() => handleSelectMember(m)} className={cn("w-full flex items-center gap-2.5 px-3 py-[8px] mx-1 rounded-[var(--radius-sm)] text-left transition-all cursor-pointer", selected?.id === m.id ? "bg-[var(--color-navy-light)]" : "hover:bg-[var(--color-page)]")} style={{ width: "calc(100% - 8px)" }}>
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: m.color }}>{m.initials}</div>
                      <div className={cn("absolute bottom-0 right-0 w-[8px] h-[8px] rounded-full border-[1.5px] border-white", STATUS_MAP[m.presence]?.color || "bg-gray-300")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-[12.5px] truncate", selected?.id === m.id ? "font-semibold text-[var(--color-t1)]" : "text-[var(--color-t2)]")}>{m.name}</div>
                      <div className="text-[10.5px] text-[var(--color-t3)]">{ROLE_MAP[m.role] || m.role} · {m.departmentName}</div>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Área de DM */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-[var(--color-page)]">
          {/* Header */}
          <div className="bg-white border-b border-[var(--color-border)] p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: selected.color }}>{selected.initials}</div>
                <div className={cn("absolute bottom-0 right-0 w-[13px] h-[13px] rounded-full border-[2.5px] border-white", STATUS_MAP[selected.presence]?.color)} />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[var(--color-t1)]">{selected.name}</h2>
                <p className="text-[12px] text-[var(--color-t2)]">{ROLE_MAP[selected.role] || selected.role} · {selected.departmentName}</p>
                <p className="text-[11px] text-[var(--color-t3)] mt-0.5">{selected.email}</p>
              </div>
              <span className={cn("ml-auto px-2.5 py-1 rounded-full text-[11px] font-bold", {
                "bg-[var(--color-green-light)] text-[var(--color-green)]": selected.presence === "ONLINE",
                "bg-[var(--color-amber-light)] text-[var(--color-amber)]": selected.presence === "AWAY",
                "bg-[var(--color-page)] text-[var(--color-t3)] border border-[var(--color-border)]": selected.presence === "OFFLINE",
              })}>{STATUS_MAP[selected.presence]?.label}</span>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-2">
            <div className="text-[11px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Mensagem direta
            </div>
            {dmLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[var(--color-navy)] animate-spin" />
              </div>
            ) : dmMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px] text-[var(--color-t3)]">Nenhuma conversa ainda. Envie a primeira mensagem!</p>
              </div>
            ) : (
              dmMessages.map((msg) => {
                const isMine = msg.userId === myId;
                return (
                  <div key={msg.id} className={cn("flex gap-2.5 max-w-[75%]", isMine ? "ml-auto flex-row-reverse" : "")}>
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5" style={{ background: msg.userColor }}>{msg.userInitials}</div>
                    )}
                    <div className={cn("px-3 py-2 rounded-[var(--radius-sm)] text-[13px]", isMine ? "bg-[var(--color-navy)] text-white rounded-br-[4px]" : "bg-white border border-[var(--color-border)] text-[var(--color-t1)] rounded-bl-[4px]")}>
                      <p>{msg.content}</p>
                      <span className={cn("text-[10px] mt-1 block", isMine ? "text-white/50 text-right" : "text-[var(--color-t3)]")}>
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={msgEnd} />
          </div>

          {/* Indicador de digitação */}
          <div className="px-5 h-5 flex items-center">
            {typingUser && (
              <span className="text-[11px] text-[var(--color-t3)] italic animate-pulse">{typingUser} está digitando...</span>
            )}
          </div>

          {/* Composer */}
          <div className="p-4 bg-white border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2 bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 focus-within:border-[var(--color-navy)] focus-within:shadow-[0_0_0_3px_#050A2D08] transition-all">
              <input
                type="text"
                className="flex-1 bg-transparent text-[13px] text-[var(--color-t1)] outline-none placeholder:text-[var(--color-t3)]"
                placeholder={`Mensagem para ${selected.name}...`}
                value={dmInput}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={sending || dmLoading || !dmChannelId}
              />
              <button onClick={handleSend} disabled={sending || dmLoading || !dmChannelId} className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer", dmInput.trim() && dmChannelId ? "bg-[var(--color-navy)] text-white" : "bg-[var(--color-border)] text-[var(--color-t3)]")}>
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[var(--color-page)]">
          <div className="text-center">
            <div className="text-3xl mb-3">👥</div>
            <p className="text-[14px] font-bold text-[var(--color-t1)]">Selecione um membro</p>
            <p className="text-[12px] text-[var(--color-t3)] mt-1">Clique em alguém para ver perfil e iniciar uma conversa</p>
          </div>
        </div>
      )}
    </div>
  );
}
