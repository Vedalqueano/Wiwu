"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, MessageSquare, Building2, CheckSquare, Users,
  Bell, LogOut, ChevronLeft, Settings, BookOpen,
} from "lucide-react";
import { canAccess, NAV_MIN_ROLE, type UserRole } from "@/lib/rbac";

type NavItem = { name: string; href: string; icon: React.ElementType; badge?: number; badgeColor?: string };

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Principal",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Canais", href: "/channels", icon: MessageSquare, badge: 3 },
      { name: "Departamentos", href: "/departments", icon: Building2 },
      { name: "Tarefas", href: "/tasks", icon: CheckSquare },
      { name: "Membros", href: "/people", icon: Users },
      { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
    ],
  },
  {
    label: "Sistema",
    items: [
      { name: "Notificações", href: "/notifications", icon: Bell, badge: 2, badgeColor: "bg-[var(--color-red)]" },
      { name: "Configurações", href: "/settings", icon: Settings },
    ],
  },
  {
    label: "Administração",
    items: [
      { name: "Painel Admin", href: "/admin", icon: Settings }, // Pode usar icon diferente como Shield ou Settings
    ],
  },
];

const ROLE_MAP: Record<string, string> = {
  SUPER: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Gerente",
  EMPLOYEE: "Funcionário",
  VIEWER: "Visualizador",
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();

  const user = session?.user as any;
  const userName = user?.name || "Usuário";
  const userInitials = user?.initials || userName.slice(0, 2).toUpperCase();
  const userColor = user?.color || "#050A2D";
  const userRole = ROLE_MAP[user?.role] || user?.role || "—";
  const deptName = user?.departmentName || "—";
  const deptSlug = user?.departmentSlug || "";

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-[var(--color-border)] shrink-0 transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[var(--color-border)] flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-[var(--color-navy)] flex items-center justify-center text-white text-xs font-bold shrink-0">
          W
        </div>
        {!collapsed && (
          <div className="text-[13px] font-bold text-[var(--color-t1)] tracking-tight">WiWU Flow</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "ml-auto w-6 h-6 rounded flex items-center justify-center text-[var(--color-t3)] hover:bg-[var(--color-page)] transition-all cursor-pointer",
            collapsed && "ml-0"
          )}
        >
          <ChevronLeft className={cn("w-3.5 h-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Department badge — data from session */}
      {!collapsed && (
        <Link
          href={deptSlug ? `/departments/${deptSlug}` : "/departments"}
          className="mx-2.5 mt-2.5 mb-1.5 flex items-center gap-2 p-2.5 bg-[var(--color-navy)] rounded-[var(--radius-sm)] hover:bg-[var(--color-navy-2)] transition-colors"
        >
          <div className="w-[7px] h-[7px] rounded-full bg-[var(--color-red)] shrink-0" />
          <span className="text-[12px] font-bold text-white">{deptName}</span>
          <span className="text-[10px] text-white/45 ml-auto">{userRole}</span>
        </Link>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1.5 scrollbar-none">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-0.5">
            {!collapsed && (
              <div className="px-4 pt-2 pb-0.5 text-[10px] font-bold text-[var(--color-t3)] uppercase tracking-wider">
                {section.label}
              </div>
            )}
            {section.items.filter((item) => {
              const minRole = NAV_MIN_ROLE[item.href];
              return !minRole || canAccess(user?.role as UserRole, minRole);
            }).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2.5 mx-1.5 my-0.5 rounded-[var(--radius-sm)] transition-all",
                    collapsed ? "justify-center p-2" : "px-2.5 py-[7px]",
                    isActive
                      ? "bg-[var(--color-navy-light)]"
                      : "hover:bg-[var(--color-page)]"
                  )}
                >
                  {isActive && !collapsed && (
                    <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-[3px] h-3.5 bg-[var(--color-navy)] rounded-r" />
                  )}
                  <item.icon
                    className={cn(
                      "w-[15px] h-[15px] shrink-0",
                      isActive ? "text-[var(--color-navy)]" : "text-[var(--color-t3)]"
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className={cn(
                        "text-[12.5px] flex-1",
                        isActive ? "text-[var(--color-t1)] font-semibold" : "text-[var(--color-t2)]"
                      )}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className={cn(
                          "min-w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1",
                          item.badgeColor || "bg-[var(--color-navy)]"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User — data from session */}
      <div className={cn(
        "border-t border-[var(--color-border)] flex items-center gap-2.5",
        collapsed ? "justify-center p-3" : "p-3"
      )}>
        <div
          className="w-8 h-8 rounded-full text-white flex items-center justify-center text-[11px] font-bold shrink-0 relative"
          style={{ background: userColor }}
        >
          {userInitials}
          <div className="absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full bg-[var(--color-online)] border-2 border-white" />
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-bold text-[var(--color-t1)] truncate">{userName}</div>
              <div className="text-[10.5px] text-[var(--color-t3)]">{userRole} · online</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center border border-[var(--color-border)] hover:bg-[var(--color-page)] transition-colors cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-3 h-3 text-[var(--color-t3)]" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
