import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        creator: { select: { name: true, initials: true } },
        assignee: { select: { name: true, initials: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      creatorName: t.creator.name,
      assigneeName: t.assignee?.name || null,
      assigneeInitials: t.assignee?.initials || null,
      assigneeColor: t.assignee?.color || null,
      createdAt: t.createdAt,
    })));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!canAccess((session?.user as any)?.role, "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { title, description, priority, assigneeId, creatorId } = await req.json();

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        creatorId,
        assigneeId,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!canAccess((session?.user as any)?.role, "EMPLOYEE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id, status, title } = await req.json();
    
    const task = await prisma.task.update({
      where: { id },
      data: { ...(status && { status }), ...(title && { title }) },
    });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
