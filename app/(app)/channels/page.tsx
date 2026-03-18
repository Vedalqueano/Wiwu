"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import { Hash, Lock, Megaphone, Send, Smile, Paperclip, AtSign, Loader2, MessageSquare } from "lucide-react";

type Channel = { id: string; name: string; slug: string; type: string; description: string; departmentName?: string; messageCount: number; memberCount: number };
type Message = { id: string; content: string; channelId: string; channelName: string; userId: string; userName: string; userInitials: string; userColor: string; userPresence: string; reactions: { emoji: string; userName: string }[]; createdAt: string };
type Member = { id: string; name: string; initials: string; color: string; role: string; presence: string; departmentName: string };

const ROLE_MAP: Record<string, string> = { SUPER: "Super Admin", ADMIN: "Admin", MANAGER: "Gerente", EMPLOYEE: "Funcionário", VIEWER: "Visualizador" };

/* ── Renderiza @menções como spans clicáveis ─────────────────────── */
function renderMentions(
  content: string,
  members: Member[],
  onMentionClick: (memberId: string) => void
): React.ReactNode {
  const parts = content.split(/(@\S+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const query = part.slice(1).toLowerCase();
          const member = members.find((m) => m.name.toLowerCase().startsWith(query));
          if (member) {
            return (
              <span
                key={i}
                onClick={(e) => { e.stopPropagation(); onMentionClick(member.id); }}
                className="text-[var(--color-navy)] font-semibold cursor-pointer hover:underline bg-[#050A2D0D] px-1 rounded"
              >
                {part}
              </span>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function ChannelsPage() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dmChannels, setDmChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeChannelId, setActiveChannelId] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionResults, setMentionResults] = useState<Member[]>([]);
  const msgEnd = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/channels").then((r) => r.json()),
      fetch("/api/messages").then((r) => r.json()),
      fetch("/api/members").then((r) => r.json()),
    ]).then(([ch, msgs, mem]) => {
      setChannels(ch);
      setMessages(msgs);
      setMembers(mem);
      if (ch.length > 0) setActiveChannelId(ch[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeChannelId]);

  const handleNewMessage = useCallback((msg: Message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === msg.id);
      return exists ? prev : [...prev, msg];
    });
  }, []);

  const { emitTyping, emitStopTyping } = useSocket(
    activeChannelId,
    handleNewMessage,
    (userName) => setTypingUser(userName),
    () => setTypingUser(null)
  );

  /* ── Abrir DM com outro usuário ──────────────────────────────────── */
  const openDm = useCallback(async (otherId: string) => {
    const myId = (session?.user as any)?.id;
    if (!myId || myId === otherId) return;

    const res = await fetch("/api/dm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ myId, otherId }),
    });
    if (!res.ok) return;

    const { channelId, messages: dmMsgs } = await res.json();
    const otherMember = members.find((m) => m.id === otherId);

    setDmChannels((prev) => {
      if (prev.find((c) => c.id === channelId)) return prev;
      return [...prev, {
        id: channelId,
        name: otherMember?.name ?? "DM",
        slug: `dm-${otherId}`,
        type: "DIRECT",
        description: "Mensagem direta",
        messageCount: 0,
        memberCount: 2,
      }];
    });

    setMessages((prev) => {
      const filtered = prev.filter((m) => m.channelId !== channelId);
      return [...filtered, ...dmMsgs];
    });

    setActiveChannelId(channelId);
  }, [session, members]);

  /* ── Clique numa @menção → abre DM ──────────────────────────────── */
  const handleMentionClick = useCallback((memberId: string) => {
    openDm(memberId);
  }, [openDm]);

  const allChannels = [...channels, ...dmChannels];
  const activeChannel = allChannels.find((c) => c.id === activeChannelId);
  const channelMsgs = messages.filter((m) => m.channelId === activeChannelId);
  const onlineMembers = members.filter((m) => m.presence === "ONLINE");

  /* ── Enviar mensagem ─────────────────────────────────────────────── */
  const handleSend = async () => {
    if (!newMsg.trim() || !activeChannelId || sending) return;
    setSending(true);
    emitStopTyping();
    const content = newMsg;
    setNewMsg("");
    setMentionOpen(false);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, channelId: activeChannelId, userId: (session?.user as any)?.id }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) => {
          if (prev.find((m) => m.id === saved.id)) return prev;
          return [...prev, { ...saved, channelName: activeChannel?.name || "" }];
        });
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  /* ── Input com detecção de @menção ───────────────────────────────── */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMsg(val);

    const atMatch = val.match(/@([^\s@]*)$/);
    if (atMatch) {
      const query = atMatch[1];
      setMentionFilter(query);
      setMentionOpen(true);
      const myId = (session?.user as any)?.id;
      setMentionResults(
        members
          .filter((m) => m.id !== myId && m.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)
      );
    } else {
      setMentionOpen(false);
    }

    emitTyping(session?.user?.name || "Alguém");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(), 2000);
  };

  /* ── Inserir menção via autocomplete ─────────────────────────────── */
  const insertMention = (member: Member) => {
    const lastAt = newMsg.lastIndexOf("@");
    const before = lastAt >= 0 ? newMsg.slice(0, lastAt) : newMsg;
    setNewMsg(`${before}@${member.name} `);
    setMentionOpen(false);
    setMentionFilter("");
  };

  const iconMap: Record<string, React.ElementType> = {
    PUBLIC: Hash,
    ANNOUNCEMENT: Megaphone,
    DEPARTMENT: Hash,
    PRIVATE: Lock,
    DIRECT: MessageSquare,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-[var(--color-navy)] animate-spin" />
      <span className="ml-2 text-[13px] text-[var(--color-t3)]">Carregando canais...</span>
    </div>
  );

  return (
    <div className="flex h-full -m-[22px] bg-white">
      {/* Secondary Sidebar */}
      <div className="w-[260px] bg-slate-50 border-r border-[var(--color-border)] flex flex-col shrink-0">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h2 className="text-[15px] font-bold text-[var(--color-t1)] tracking-tight">Comunicação</h2>
          <p className="text-[11px] text-[var(--color-t3)] mt-0.5">{channels.length} canais disponíveis</p>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-2">
          <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-2 ml-2">Canais</div>
          {channels.map((ch) => {
            const Icon = iconMap[ch.type] || Hash;
            const isActive = ch.id === activeChannelId;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={cn(
                  "relative w-full flex items-center gap-2.5 px-3 py-2 mb-0.5 rounded-md text-left transition-all cursor-pointer group",
                  isActive ? "bg-[var(--color-navy-light)] text-[var(--color-navy)]" : "hover:bg-slate-200/50 text-[var(--color-t2)]"
                )}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--color-navy)] rounded-r-md" />}
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[var(--color-navy)]" : "text-[var(--color-t3)] group-hover:text-[var(--color-t2)]")} />
                <span className={cn("text-[13px] flex-1 truncate", isActive ? "font-bold" : "font-medium")}>{ch.name}</span>
                {ch.messageCount > 0 && (
                  <span className="text-[10px] font-bold bg-[var(--color-navy)] text-white px-1.5 py-0.5 rounded-full z-10">
                    {ch.messageCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Mensagens Diretas */}
          {dmChannels.length > 0 && (
            <>
              <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-2 ml-2 mt-4">Mensagens Diretas</div>
              {dmChannels.map((ch) => {
                const isActive = ch.id === activeChannelId;
                const otherMember = members.find((m) => m.name === ch.name);
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={cn(
                      "relative w-full flex items-center gap-2.5 px-3 py-2 mb-0.5 rounded-md text-left transition-all cursor-pointer group",
                      isActive ? "bg-[var(--color-navy-light)] text-[var(--color-navy)]" : "hover:bg-slate-200/50 text-[var(--color-t2)]"
                    )}
                  >
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--color-navy)] rounded-r-md" />}
                    <div
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: otherMember?.color ?? "#6b7280" }}
                    >
                      {otherMember?.initials ?? ch.name[0]}
                    </div>
                    <span className={cn("text-[13px] flex-1 truncate", isActive ? "font-bold" : "font-medium")}>{ch.name}</span>
                    <div className="w-2 h-2 rounded-full bg-[var(--color-online)] shrink-0" />
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Online members — clicar abre DM */}
        <div className="border-t border-[var(--color-border)] p-4 bg-slate-100/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider">
              Online ({onlineMembers.length})
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {onlineMembers.map((m) => (
              <div key={m.id} onClick={() => openDm(m.id)} className="flex items-center gap-2.5 group cursor-pointer">
                <div className="relative">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ background: m.color }}>
                    {m.initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-full bg-[var(--color-online)] border-2 border-slate-50" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-[var(--color-t1)] truncate group-hover:underline">{m.name}</div>
                  <div className="text-[10.5px] text-[var(--color-t3)] truncate">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white relative min-w-0">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 h-[60px] bg-white/80 backdrop-blur-md border-b border-[var(--color-border)] flex items-center px-6 gap-3">
          {(() => { const Icon = iconMap[activeChannel?.type || "PUBLIC"] || Hash; return <Icon className="w-5 h-5 text-[var(--color-t2)]" />; })()}
          <div>
            <h1 className="text-[16px] font-bold text-[var(--color-t1)] leading-none mb-1">
              {activeChannel?.name || "Selecione um canal"}
            </h1>
            <p className="text-[12px] text-[var(--color-t3)] leading-none">
              {activeChannel?.type === "DIRECT" ? "Conversa privada" : (activeChannel?.description || "Bem-vindo ao canal!")}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center -space-x-2">
              {members.slice(0, 3).map((m, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm" style={{ background: m.color, zIndex: 10 - i }}>
                  {m.initials}
                </div>
              ))}
              {members.length > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-sm z-0">
                  +{members.length - 3}
                </div>
              )}
            </div>
            <span className="text-[12px] font-medium text-[var(--color-t2)]">{activeChannel?.memberCount || members.length} membros</span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto pt-[80px] pb-4 px-6 flex flex-col gap-4">
          {channelMsgs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-70">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                {activeChannel?.type === "DIRECT" ? "💬" : "💭"}
              </div>
              <h3 className="text-[15px] font-bold text-[var(--color-t1)] mb-1">
                {activeChannel?.type === "DIRECT"
                  ? `Início da conversa com ${activeChannel.name}`
                  : `Este é o começo do canal #${activeChannel?.name}`}
              </h3>
              <p className="text-[13px] text-[var(--color-t3)]">Envie uma mensagem para iniciar a conversa.</p>
            </div>
          ) : (
            channelMsgs.map((msg, i) => {
              const prevMsg = i > 0 ? channelMsgs[i - 1] : null;
              const isGrouped = prevMsg && prevMsg.userId === msg.userId && (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60000);
              const msgMember = members.find((m) => m.id === msg.userId);

              return (
                <div key={msg.id} className={cn("group flex gap-3 hover:bg-slate-50/80 -mx-4 px-4 py-1.5 transition-colors rounded-lg relative", isGrouped ? "mt-0" : "mt-2")}>
                  {isGrouped ? (
                    <div className="w-8 shrink-0 flex items-start justify-center pt-1 opacity-0 group-hover:opacity-100">
                      <span className="text-[9px] font-medium text-[var(--color-t3)]">
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5" style={{ background: msg.userColor }}>
                      {msg.userInitials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pr-16">
                    {!isGrouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-[14px] font-bold text-[var(--color-t1)] hover:underline cursor-pointer">{msg.userName}</span>
                        {msgMember && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100/80 text-slate-500">
                            {msgMember.departmentName && msgMember.departmentName !== "—" ? msgMember.departmentName : ROLE_MAP[msgMember.role] || msgMember.role}
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-[var(--color-t3)]">
                          {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                    <p className="text-[14px] text-slate-800 leading-normal">
                      {renderMentions(msg.content, members, handleMentionClick)}
                    </p>

                    {msg.reactions.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {msg.reactions.map((r, ri) => (
                          <span key={ri} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-200 transition-colors">
                            {r.emoji} <span className="font-semibold text-slate-600">{r.userName}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="opacity-0 group-hover:opacity-100 absolute right-4 top-0 -translate-y-2 bg-white border border-slate-200 shadow-sm rounded-md flex items-center overflow-hidden transition-opacity">
                    <button className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" title="Adicionar Reação"><Smile className="w-4 h-4" /></button>
                    <button className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" title="Responder em Thread"><MessageSquare className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={msgEnd} />
        </div>

        {/* Typing indicator */}
        <div className="px-6 h-6 flex items-center bg-white">
          {typingUser && (
            <span className="text-[11.5px] font-medium text-[var(--color-t3)] italic animate-pulse">
              <span className="font-bold">{typingUser}</span> está digitando...
            </span>
          )}
        </div>

        {/* Composer */}
        <div className="px-6 pb-6 bg-white shrink-0 relative">
          {/* Autocomplete de @menção */}
          {mentionOpen && mentionResults.length > 0 && (
            <div className="absolute bottom-full left-6 right-6 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-20">
              {mentionResults.map((m) => (
                <button
                  key={m.id}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ background: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--color-t1)]">{m.name}</div>
                    <div className="text-[11px] text-[var(--color-t3)]">{ROLE_MAP[m.role] || m.role}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm focus-within:border-[var(--color-navy)] focus-within:shadow-[0_0_0_3px_#050A2D10] transition-all bg-white flex flex-col">
            <input
              type="text"
              className="w-full px-4 py-3 bg-transparent text-[14px] text-[var(--color-t1)] outline-none placeholder:text-[var(--color-t3)]"
              placeholder={
                activeChannel?.type === "DIRECT"
                  ? `Mensagem para ${activeChannel.name}...`
                  : `Enviar mensagem em #${activeChannel?.name || ""}...`
              }
              value={newMsg}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !mentionOpen) handleSend();
                if (e.key === "Escape") setMentionOpen(false);
              }}
              disabled={sending}
            />
            <div className="bg-slate-50 px-2 py-1.5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded text-[var(--color-t3)] hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer" title="Anexar arquivo"><Paperclip className="w-4 h-4" /></button>
                <button className="p-1.5 rounded text-[var(--color-t3)] hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer" title="Formatação"><span className="font-bold text-[13px] px-1">Aa</span></button>
                <button
                  onClick={() => {
                    setNewMsg((v) => v + "@");
                    setMentionOpen(true);
                    setMentionFilter("");
                    setMentionResults(members.filter((m) => m.id !== (session?.user as any)?.id).slice(0, 5));
                  }}
                  className="p-1.5 rounded text-[var(--color-t3)] hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
                  title="Mencionar"
                >
                  <AtSign className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded text-[var(--color-t3)] hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer" title="Emoji"><Smile className="w-4 h-4" /></button>
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !newMsg.trim()}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold transition-colors cursor-pointer",
                  newMsg.trim() ? "bg-[var(--color-navy)] text-white shadow-sm hover:bg-[var(--color-navy-2)]" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /> Enviar</>}
              </button>
            </div>
          </div>
          <div className="mt-2 px-1">
            <div className="text-[10px] text-[var(--color-t3)] font-medium">
              Pressione <kbd className="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono">Enter</kbd> para enviar ·{" "}
              <kbd className="px-1 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono">@</kbd> para mencionar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
