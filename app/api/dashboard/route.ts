import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // KPIs do inventário
    const inventory = await prisma.inventoryItem.findMany();
    const lowStock = inventory.filter((i) => i.quantity < i.minimum);

    // Tarefas
    const tasks = await prisma.task.findMany({ include: { assignee: true } });
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const done = tasks.filter((t) => t.status === "DONE").length;

    // Notificações não lidas
    const unreadNotifs = await prisma.notification.count({ where: { read: false } });

    // Mensagens recentes
    const recentMessages = await prisma.message.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, initials: true } }, channel: { select: { name: true } } },
    });

    return NextResponse.json({
      kpis: {
        totalOrders: 47,
        inSeparation: lowStock.length,
        shipped: done,
        divergences: 2,
      },
      lowStockItems: lowStock.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        minimum: i.minimum,
        pct: Math.round((i.quantity / Math.max(i.minimum, 1)) * 100),
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee?.name || "—",
      })),
      recentMessages: recentMessages.map((m) => ({
        content: m.content,
        userName: m.user.name,
        channelName: m.channel.name,
        createdAt: m.createdAt,
      })),
      unreadNotifs,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
