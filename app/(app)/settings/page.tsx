export default function SettingsPage() {
  type SettingItem = { label: string; value: string; toggle?: boolean };
  type Section = { title: string; items: SettingItem[] };
  
  const sections: Section[] = [
    {
      title: "Empresa",
      items: [
        { label: "Nome da empresa", value: "WiWU Brasil" },
        { label: "Domínio", value: "flow.wiwu.com.br" },
        { label: "Plano", value: "Business" },
      ],
    },
    {
      title: "Notificações",
      items: [
        { label: "Menções (@)", value: "Ativado", toggle: true },
        { label: "Mensagens diretas", value: "Ativado", toggle: true },
        { label: "Tarefas atribuídas", value: "Ativado", toggle: true },
        { label: "Estoque baixo", value: "Ativado", toggle: true },
      ],
    },
    {
      title: "Aparência",
      items: [
        { label: "Tema", value: "Claro" },
        { label: "Idioma", value: "Português (BR)" },
        { label: "Fusos horário", value: "GMT-3 (Brasília)" },
      ],
    },
  ];

  return (
    <div className="animate-fade-in max-w-[600px]">
      <h2 className="text-[15px] font-bold text-[var(--color-t1)] mb-4">Configurações</h2>

      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.title} className="bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-page)]">
              <h3 className="text-[12px] font-bold text-[var(--color-t2)] uppercase tracking-wider">{section.title}</h3>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[13px] text-[var(--color-t1)]">{item.label}</span>
                  {item.toggle ? (
                    <div className="w-9 h-5 rounded-full bg-[var(--color-navy)] relative cursor-pointer">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" />
                    </div>
                  ) : (
                    <span className="text-[13px] text-[var(--color-t3)]">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
