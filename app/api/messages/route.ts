import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, initials: true, color: true, presence: true } },
        channel: { select: { name: true } },
        reactions: { include: { user: { select: { name: true } } } },
      },
    });

    return NextResponse.json(messages.map((m) => ({
      id: m.id,
      content: m.content,
      channelId: m.channelId,
      channelName: m.channel.name,
      userId: m.user.id,
      userName: m.user.name,
      userInitials: m.user.initials,
      userColor: m.user.color,
      userPresence: m.user.presence,
      reactions: m.reactions.map((r) => ({ emoji: r.emoji, userName: r.user.name })),
      createdAt: m.createdAt,
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
    const { content, channelId, userId } = await req.json();
    if (!content || !channelId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { content, channelId, userId },
      include: { user: { select: { name: true, initials: true, color: true } } },
    });

    const payload = {
      id: message.id,
      content: message.content,
      channelId,
      channelName: "",
      userId,
      userName: message.user.name,
      userInitials: message.user.initials,
      userColor: message.user.color,
      userPresence: "ONLINE",
      reactions: [],
      createdAt: message.createdAt,
    };

    const io = (global as any).io;
    if (io) {
      io.to(channelId).emit("new-message", payload);
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
