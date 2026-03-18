import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/dm — busca ou cria um canal DIRECT entre dois usuários
export async function POST(req: Request) {
  try {
    const { myId, otherId } = await req.json();
    if (!myId || !otherId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Slug consistente independente de quem inicia
    const [idA, idB] = [myId, otherId].sort();
    const slug = `dm-${idA}-${idB}`;

    // Buscar canal DIRECT existente
    let channel = await prisma.channel.findFirst({
      where: { slug, type: "DIRECT" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, initials: true, color: true, presence: true } },
            reactions: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    // Criar canal se não existir
    if (!channel) {
      const [userA, userB] = await Promise.all([
        prisma.user.findUnique({ where: { id: myId }, select: { name: true, companyId: true } }),
        prisma.user.findUnique({ where: { id: otherId }, select: { name: true } }),
      ]);

      channel = await prisma.channel.create({
        data: {
          name: `${userA?.name} & ${userB?.name}`,
          slug,
          type: "DIRECT",
          companyId: userA!.companyId,
          members: {
            create: [{ userId: myId }, { userId: otherId }],
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, name: true, initials: true, color: true, presence: true } },
              reactions: { include: { user: { select: { name: true } } } },
            },
          },
        },
      });
    }

    const messages = channel.messages.map((m) => ({
      id: m.id,
      content: m.content,
      channelId: channel!.id,
      channelName: channel!.name,
      userId: m.user.id,
      userName: m.user.name,
      userInitials: m.user.initials,
      userColor: m.user.color,
      userPresence: m.user.presence,
      reactions: m.reactions.map((r) => ({ emoji: r.emoji, userName: r.user.name })),
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ channelId: channel.id, messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
