"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import { Hash, Lock, Megaphone, Send, Smile, Paperclip, AtSign, Loader2 } from "lucide-react";

type Channel = { id: string; name: string; slug: string; type: string; description: string; departmentName?: string; messageCount: number; memberCount: number };
type Message = { id: string; content: string; channelId: string; channelName: string; userId: string; userName: string; userInitials: string; userColor: string; userPresence: string; reactions: { emoji: string; userName: string }[]; createdAt: string };
type Member = { id: string; name: string; initials: string; color: string; role: string; presence: string; departmentName: string };

export default function ChannelsPage() {
  const { data: session } = useSession();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeChannelId, setActiveChannelId] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
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

  const handleUserTyping = useCallback((userName: string) => {
    setTypingUser(userName);
  }, []);

  const handleUserStopTyping = useCallback(() => {
    setTypingUser(null);
  }, []);

  const { emitTyping, emitStopTyping } = useSocket(
    activeChannelId,
    handleNewMessage,
    handleUserTyping,
    handleUserStopTyping
  );

  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const channelMsgs = messages.filter((m) => m.channelId === activeChannelId);
  const onlineMembers = members.filter((m) => m.presence === "ONLINE");

  const handleSend = async () => {
    if (!newMsg.trim() || !activeChannelId || sending) return;
    setSending(true);
    emitStopTyping();
    const content = newMsg;
    setNewMsg("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, channelId: activeChannelId, userId: (session?.user as any)?.id }),
      });
      if (res.ok) {
        const saved = await res.json();
        // Remetente vê a mensagem via API. Socket entrega para os outros.
        // Deduplicação garante que não apareça duas vezes.
        setMessages((prev) => {
          if (prev.find((m) => m.id === saved.id)) return prev;
          return [...prev, { ...saved, channelName: activeChannel?.name || "" }];
        });
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMsg(e.target.value);
    const userName = session?.user?.name || "Alguém";
    emitTyping(userName);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitStopTyping(), 2000);
  };

  const iconMap: Record<string, React.ElementType> = { PUBLIC: Hash, ANNOUNCEMENT: Megaphone, DEPARTMENT: Hash, PRIVATE: Lock, DM: Lock };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-[var(--color-navy)] animate-spin" /><span className="ml-2 text-[13px] text-[var(--color-t3)]">Carregando canais...</span></div>;

  return (
    <div className="flex h-full -m-[22px]">
      {/* Channel list */}
      <div className="w-[240px] bg-white border-r border-[var(--color-border)] flex flex-col shrink-0">
        <div className="p-3.5 border-b border-[var(--color-border)]">
          <h2 className="text-[13px] font-bold text-[var(--color-t1)]">Canais</h2>
          <p className="text-[11px] text-[var(--color-t3)] mt-0.5">{channels.length} canais</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {channels.map((ch) => {
            const Icon = iconMap[ch.type] || Hash;
            const isActive = ch.id === activeChannelId;
            return (
              <button key={ch.id} onClick={() => setActiveChannelId(ch.id)} className={cn("w-full flex items-center gap-2 px-3 py-[7px] mx-1 rounded-[var(--radius-sm)] text-left transition-colors cursor-pointer", isActive ? "bg-[var(--color-navy-light)]" : "hover:bg-[var(--color-page)]")} style={{ width: "calc(100% - 8px)" }}>
                <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-[var(--color-navy)]" : "text-[var(--color-t3)]")} />
                <span className={cn("text-[12.5px] flex-1 truncate", isActive ? "font-semibold text-[var(--color-t1)]" : "text-[var(--color-t2)]")}>{ch.name}</span>
                {ch.messageCount > 0 && <span className="text-[10px] text-[var(--color-t3)]">{ch.messageCount}</span>}
              </button>
            );
          })}
        </div>

        {/* Online members */}
        <div className="border-t border-[var(--color-border)] p-3">
          <div className="text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider mb-2">
            Online — {onlineMembers.length}
          </div>
          <div className="flex flex-col gap-1">
            {onlineMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: m.color }}>{m.initials}</div>
                  <div className="absolute bottom-0 right-0 w-[7px] h-[7px] rounded-full bg-[var(--color-online)] border-[1.5px] border-white" />
                </div>
                <span className="text-[12px] text-[var(--color-t2)]">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[var(--color-page)]">
        {/* Header */}
        <div className="h-[50px] bg-white border-b border-[var(--color-border)] flex items-center px-5 gap-2 shrink-0">
          {(() => { const Icon = iconMap[activeChannel?.type || "PUBLIC"] || Hash; return <Icon className="w-4 h-4 text-[var(--color-t3)]" />; })()}
          <span className="text-[14px] font-bold text-[var(--color-t1)]">{activeChannel?.name || "—"}</span>
          <span className="text-[12px] text-[var(--color-t3)] ml-2">{activeChannel?.description}</span>
          <span className="text-[11px] text-[var(--color-t3)] ml-auto">{activeChannel?.memberCount || 0} membros</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-1">
          {channelMsgs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-[13px] text-[var(--color-t3)]">Nenhuma mensagem neste canal ainda.</p>
                <p className="text-[12px] text-[var(--color-t3)]">Seja o primeiro a enviar!</p>
              </div>
            </div>
          ) : (
            channelMsgs.map((msg) => (
              <div key={msg.id} className="flex gap-3 py-1.5 rounded-lg hover:bg-white/60 px-2 -mx-2 transition-colors group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5" style={{ background: msg.userColor }}>
                  {msg.userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-bold text-[var(--color-t1)]">{msg.userName}</span>
                    <span className="text-[11px] text-[var(--color-t3)]">{new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-[13px] text-[var(--color-t2)] mt-0.5 leading-relaxed">{msg.content}</p>
                  {msg.reactions.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {msg.reactions.map((r, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--color-navy-light)] border border-[var(--color-border)] text-[11px] cursor-pointer hover:bg-[#050A2D14] transition-colors">
                          {r.emoji} <span className="font-semibold text-[var(--color-navy)]">{r.userName}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={msgEnd} />
        </div>

        {/* Typing indicator */}
        <div className="px-5 h-5 flex items-center">
          {typingUser && (
            <span className="text-[11px] text-[var(--color-t3)] italic">{typingUser} está digitando...</span>
          )}
        </div>

        {/* Composer */}
        <div className="p-4 bg-white border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2 bg-[var(--color-page)] border border-[var(--color-border)] rounded-[var(--radius-md)] px-3 py-2 focus-within:border-[var(--color-navy)] focus-within:shadow-[0_0_0_3px_#050A2D08] transition-all">
            <button className="text-[var(--color-t3)] hover:text-[var(--color-t2)] cursor-pointer"><Paperclip className="w-4 h-4" /></button>
            <input
              type="text"
              className="flex-1 bg-transparent text-[13px] text-[var(--color-t1)] outline-none placeholder:text-[var(--color-t3)]"
              placeholder={`Mensagem em #${activeChannel?.name || ""}...`}
              value={newMsg}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={sending}
            />
            <button className="text-[var(--color-t3)] hover:text-[var(--color-t2)] cursor-pointer"><AtSign className="w-4 h-4" /></button>
            <button className="text-[var(--color-t3)] hover:text-[var(--color-t2)] cursor-pointer"><Smile className="w-4 h-4" /></button>
            <button onClick={handleSend} disabled={sending} className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer", newMsg.trim() ? "bg-[var(--color-navy)] text-white" : "bg-[var(--color-border)] text-[var(--color-t3)]")}>
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
