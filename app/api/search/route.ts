import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/search?q=termo — busca global
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json({ members: [], tasks: [], messages: [], policies: [] });

    const companyId = user.companyId as string;

    const [members, tasks, messages, policies] = await Promise.all([
      // Membros
      prisma.user.findMany({
        where: {
          companyId,
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { matricula: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          initials: true,
          color: true,
          role: true,
          department: { select: { name: true } },
        },
        take: 5,
      }),

      // Tarefas
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
          creator: { companyId },
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          assignee: { select: { name: true, initials: true, color: true } },
        },
        take: 5,
      }),

      // Mensagens (últimas, sem DIRECT)
      prisma.message.findMany({
        where: {
          content: { contains: q },
          channel: {
            companyId,
            type: { not: "DIRECT" },
          },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          channelId: true,
          channel: { select: { name: true, slug: true } },
          user: { select: { name: true, initials: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Políticas (Knowledge Base)
      prisma.policy.findMany({
        where: {
          published: true,
          department: { companyId },
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
          ],
        },
        select: {
          id: true,
          title: true,
          version: true,
          department: { select: { name: true, color: true } },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({ members, tasks, messages, policies });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
