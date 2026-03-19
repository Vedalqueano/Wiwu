"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sparkles, User, Users, MessageSquare, BookOpen,
  Bell, Rocket, ChevronRight, ChevronLeft, Check,
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: Sparkles,
    title: "Bem-vindo ao WiWU Flow!",
    subtitle: "Sua central de comunicação interna",
    color: "#050A2D",
  },
  {
    id: 2,
    icon: User,
    title: "Seu perfil",
    subtitle: "Veja como você aparece para a equipe",
    color: "#6366F1",
  },
  {
    id: 3,
    icon: Users,
    title: "Sua equipe",
    subtitle: "Conheça seu departamento",
    color: "#0EA5E9",
  },
  {
    id: 4,
    icon: MessageSquare,
    title: "Canais de comunicação",
    subtitle: "Converse em tempo real com sua equipe",
    color: "#10B981",
  },
  {
    id: 5,
    icon: BookOpen,
    title: "Processos da empresa",
    subtitle: "Consulte os procedimentos do seu setor",
    color: "#F59E0B",
  },
  {
    id: 6,
    icon: Bell,
    title: "Notificações",
    subtitle: "Fique por dentro de tudo que importa",
    color: "#EF4444",
  },
  {
    id: 7,
    icon: Rocket,
    title: "Tudo pronto!",
    subtitle: "Vamos começar a trabalhar",
    color: "#050A2D",
  },
];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0); // índice 0-6
  const [completing, setCompleting] = useState(false);
  const user = session?.user as any;
  const [selectedColor, setSelectedColor] = useState(user?.color || "#050A2D");
  
  // Novos estados para interatividade
  const [joinedChannels, setJoinedChannels] = useState<string[]>(["geral", "seu-departamento"]);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    mensoes: true,
    dms: true,
    tarefas: true,
    avisos: true,
  });

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleNext = () => {
    if (!isLast) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await fetch("/api/onboarding", { 
        method: "PATCH",
        body: JSON.stringify({ 
          color: selectedColor,
          joinedChannels,
          notifications,
        }) 
      });
      await update({ onboarded: true });
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setCompleting(false);
    }
  };

  return (
    <div className="w-full max-w-[520px]">
      {/* Progresso */}
      <div className="flex items-center gap-1.5 mb-8 justify-center">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === step ? "w-8 bg-[var(--color-navy)]" : i < step ? "w-4 bg-[var(--color-navy)]/40" : "w-4 bg-[var(--color-border)]"
            )}
          />
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-md)] overflow-hidden">
        {/* Header colorido */}
        <div
          className="px-8 pt-10 pb-8 flex flex-col items-center text-center"
          style={{ background: `${currentStep.color}08` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
            style={{ background: currentStep.color }}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-[20px] font-bold text-[var(--color-t1)]">
            {step === 0 && user?.name ? `Olá, ${user.name.split(" ")[0]}! 👋` : currentStep.title}
          </h1>
          <p className="text-[13px] text-[var(--color-t3)] mt-1">{currentStep.subtitle}</p>
        </div>

        <div className="px-8 py-6 min-h-[200px]">
          <StepContent 
            step={step} 
            user={user} 
            selectedColor={selectedColor} 
            setSelectedColor={setSelectedColor}
            joinedChannels={joinedChannels}
            setJoinedChannels={setJoinedChannels}
            notifications={notifications}
            setNotifications={setNotifications}
          />
        </div>

        {/* Navegação */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] text-[13px] font-medium transition-colors",
              isFirst
                ? "text-[var(--color-t3)] cursor-not-allowed"
                : "text-[var(--color-t2)] hover:bg-[var(--color-page)] cursor-pointer"
            )}
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>

          <span className="text-[11px] text-[var(--color-t3)]">
            {step + 1} de {STEPS.length}
          </span>

          {isLast ? (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-1.5 px-5 py-2 bg-[var(--color-navy)] text-white rounded-[var(--radius-sm)] text-[13px] font-bold hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer disabled:opacity-60"
            >
              {completing ? "Entrando..." : "Entrar no Flow"}
              <Rocket className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 bg-[var(--color-navy)] text-white rounded-[var(--radius-sm)] text-[13px] font-bold hover:bg-[var(--color-navy-2)] transition-colors cursor-pointer"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepContent({ 
  step, user, selectedColor, setSelectedColor, 
  joinedChannels, setJoinedChannels,
  notifications, setNotifications
}: { 
  step: number; user: any; 
  selectedColor: string; setSelectedColor: (c: string) => void;
  joinedChannels: string[]; setJoinedChannels: React.Dispatch<React.SetStateAction<string[]>>;
  notifications: Record<string, boolean>; setNotifications: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  switch (step) {
    case 0:
      return (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-[var(--color-t2)] leading-relaxed">
            O <strong>WiWU Flow</strong> é a sua central de comunicação interna — mural de avisos, chat em tempo real e processos da empresa em um só lugar.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { label: "Mural de avisos", desc: "Comunicados e tarefas" },
              { label: "Chat em tempo real", desc: "Canais e mensagens diretas" },
              { label: "Processos", desc: "Documentação da empresa" },
              { label: "Notificações", desc: "Fique sempre por dentro" },
            ].map((f) => (
              <div key={f.label} className="bg-[var(--color-page)] rounded-[var(--radius-sm)] p-3 border border-[var(--color-border)]">
                <div className="text-[12px] font-bold text-[var(--color-t1)]">{f.label}</div>
                <div className="text-[11px] text-[var(--color-t3)]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 1:
      const colors = ["#050A2D", "#6366F1", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
      return (
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md transition-colors"
            style={{ background: selectedColor }}
          >
            {user?.initials || "??"}
          </div>
          <div className="text-center">
            <div className="text-[15px] font-bold text-[var(--color-t1)]">{user?.name || "—"}</div>
            <div className="text-[12px] text-[var(--color-t3)] mt-0.5">{user?.email || "—"}</div>
          </div>
          
          <div className="mt-2 text-center w-full">
            <p className="text-[12px] font-semibold text-[var(--color-t2)] mb-3">Escolha sua cor de perfil</p>
            <div className="flex flex-wrap justify-center gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                    selectedColor === color ? "border-[var(--color-t1)] scale-110" : "border-transparent opacity-80 hover:opacity-100"
                  )}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
        </div>
      );

    case 2:
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-[var(--color-page)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-navy)] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[var(--color-t1)]">{user?.departmentName || "Seu Departamento"}</div>
              <div className="text-[11px] text-[var(--color-t3)]">Sua equipe no WiWU Flow</div>
            </div>
          </div>
          <p className="text-[12.5px] text-[var(--color-t2)] leading-relaxed">
            Você faz parte do departamento de <strong>{user?.departmentName || "—"}</strong>. Seus colegas de equipe já estão no sistema, prontos para colaborar em canais, tarefas e projetos.
          </p>
          <p className="text-[12px] text-[var(--color-t3)]">
            Acesse <strong>Membros</strong> para ver todos os integrantes e iniciar conversas diretas.
          </p>
        </div>
      );

    case 3:
      const handleToggleChannel = (ch: string) => {
        if (ch === "geral" || ch === "seu-departamento") return; // obrigatórios não saem
        setJoinedChannels((prev: string[]) => 
          prev.includes(ch) ? prev.filter((c: string) => c !== ch) : [...prev, ch]
        );
      };
      
      return (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-[var(--color-t2)] leading-relaxed mb-1">
            Recomendamos alguns <strong>Canais</strong> para você começar. Selecione quais tópicos públicos te interessam:
          </p>
          <div className="flex flex-col gap-2">
            {[
              { id: "geral", icon: "#", name: "geral", desc: "Comunicados da empresa (obrigatório)" },
              { id: "seu-departamento", icon: "#", name: user?.departmentSlug || "departamento", desc: "Seu time principal (obrigatório)" },
              { id: "projetos", icon: "🔒", name: "projetos-Q3", desc: "Acompanhamento de metas" },
              { id: "random", icon: "☕", name: "random", desc: "Conversas paralelas e avisos casuais" },
            ].map((ch) => {
              const isActive = joinedChannels.includes(ch.id);
              const isRequired = ch.id === "geral" || ch.id === "seu-departamento";
              
              return (
                <div 
                  key={ch.name} 
                  onClick={() => handleToggleChannel(ch.id)}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] border transition-colors cursor-pointer",
                    isActive ? "bg-[var(--color-navy-light)] border-[var(--color-navy)]/30" : "bg-[var(--color-page)] border-[var(--color-border)] hover:border-[var(--color-navy)]/50",
                    isRequired && "cursor-not-allowed opacity-90"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--color-t3)] text-[13px] w-4 text-center">{ch.icon}</span>
                    <div>
                      <div className="text-[12.5px] font-bold text-[var(--color-t1)]">{ch.name}</div>
                      <div className="text-[11px] text-[var(--color-t3)] line-clamp-1">{ch.desc}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border",
                    isActive ? "bg-[var(--color-navy)] border-[var(--color-navy)]" : "bg-white border-[var(--color-border)]"
                  )}>
                    {isActive && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 4:
      return (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-[var(--color-t2)] leading-relaxed">
            Na aba <strong>Processos</strong> você encontra toda a documentação operacional da empresa, organizada por departamento.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Logística", desc: "Separação, conferência, envios" },
              { label: "Loja / Vendas", desc: "Inventário, abastecimento" },
              { label: "Gestão", desc: "Reuniões, vitrine" },
              { label: "Garantia / SAC", desc: "Garantia, atendimento" },
            ].map((area) => (
              <div key={area.label} className="rounded-[var(--radius-sm)] p-3 bg-[var(--color-page)] border border-[var(--color-border)]">
                <div className="text-[11px] font-bold text-[var(--color-t1)]">{area.label}</div>
                <div className="text-[10px] text-[var(--color-t3)] mt-0.5">{area.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-[var(--color-t3)]">
            Consulte sempre que tiver dúvidas sobre como executar uma tarefa.
          </p>
        </div>
      );

    case 5:
      const toggleNotif = (key: string) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
      };
      
      return (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-[var(--color-t2)] leading-relaxed mb-2">
            Personalize quais <strong>Notificações</strong> você quer receber para manter o foco:
          </p>
          <div className="flex flex-col gap-2">
            {[
              { id: "mensoes", label: "Menções diretas (@você)" },
              { id: "dms", label: "Mensagens privadas (DMs)" },
              { id: "tarefas", label: "Atualizações em suas tarefas" },
              { id: "avisos", label: "Comunicados e avisos gerais" },
            ].map((n) => {
              const isActive = notifications[n.id as keyof typeof notifications];
              return (
                <div 
                  key={n.id} 
                  onClick={() => toggleNotif(n.id)}
                  className="flex items-center justify-between px-3 py-2.5 bg-[var(--color-page)] rounded-[var(--radius-sm)] border border-[var(--color-border)] cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className={cn("text-[12.5px] font-medium transition-colors", isActive ? "text-[var(--color-t1)]" : "text-[var(--color-t3)]")}>
                    {n.label}
                  </span>
                  
                  {/* Custom Toggle Switch */}
                  <div className={cn(
                    "w-9 h-5 rounded-full relative transition-colors duration-200 ease-in-out shrink-0",
                    isActive ? "bg-[var(--color-navy)]" : "bg-slate-300"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
                      isActive ? "left-[18px]" : "left-[2px]"
                    )} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 6:
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-2 w-full">
            {[
              "Perfil configurado",
              "Equipe conectada",
              "Canais disponíveis",
              "Processos acessíveis",
              "Notificações ativas",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 px-3 py-2 bg-[var(--color-page)] rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                <div className="w-5 h-5 rounded-full bg-[var(--color-navy)] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-[12.5px] text-[var(--color-t1)] text-left">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[var(--color-t3)]">
            Tudo pronto! Clique em <strong>Entrar no Flow</strong> para começar.
          </p>
        </div>
      );

    default:
      return null;
  }
}
