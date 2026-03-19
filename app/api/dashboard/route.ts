import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard — dados do Mural
export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = user.companyId as string;

    const [announcements, tasks, policies, recentMessages, unreadNotifs] = await Promise.all([
      // Comunicados (pinned primeiro, depois recentes)
      prisma.announcement.findMany({
        where: { companyId },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),

      // Tarefas do usuário (atribuídas ou criadas)
      prisma.task.findMany({
        where: {
          OR: [{ assigneeId: user.id }, { creatorId: user.id }],
          status: { not: "DONE" },
        },
        include: { assignee: { select: { name: true, initials: true, color: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),

      // Processos recentes publicados
      prisma.policy.findMany({
        where: { published: true, department: { companyId } },
        include: { department: { select: { name: true, color: true } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),

      // Mensagens recentes dos canais públicos
      prisma.message.findMany({
        where: { channel: { companyId, type: { not: "DIRECT" } } },
        include: {
          user: { select: { name: true, initials: true, color: true } },
          channel: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Notificações não lidas
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        pinned: a.pinned,
        createdAt: a.createdAt,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignee: t.assignee ? { name: t.assignee.name, initials: t.assignee.initials, color: t.assignee.color } : null,
      })),
      policies: policies.map((p) => ({
        id: p.id,
        title: p.title,
        departmentName: p.department.name,
        departmentColor: p.department.color,
        updatedAt: p.updatedAt,
      })),
      recentMessages: recentMessages.map((m) => ({
        id: m.id,
        content: m.content,
        userName: m.user.name,
        userInitials: m.user.initials,
        userColor: m.user.color,
        channelName: m.channel.name,
        createdAt: m.createdAt,
      })),
      unreadNotifs,
    });
  } catch (error) {
    console.error("Mural API error:", error);
    return NextResponse.json({ error: "Failed to load mural" }, { status: 500 });
  }
}
