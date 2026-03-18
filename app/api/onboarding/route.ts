import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/onboarding — marca o usuário como onboarded no banco e pode atualizar preferências
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const text = await req.text();
    const body = text ? JSON.parse(text) : {};
    const params = body as { color?: string, joinedChannels?: string[], notifications?: any };

    await prisma.user.update({
      where: { id: userId },
      data: {
        onboarded: true,
        ...(params.color ? { color: params.color } : {}),
      },
    });

    // Processa a entrada nos canais caso tenham sido selecionados
    if (params.joinedChannels && Array.isArray(params.joinedChannels)) {
      // 1. Busca os IDs dos canais pelos nomes enviados (ex: "geral", "vendas")
      const channels = await prisma.channel.findMany({
        where: { name: { in: params.joinedChannels } },
        select: { id: true, name: true }
      });

      // 2. Prepara os upserts (conecta se já não estiver)
      if (channels.length > 0) {
        // Usa transaction para criar as memberships de forma segura
        await prisma.$transaction(
          channels.map((ch: { id: string; name: string }) => 
            prisma.channelMember.upsert({
              where: {
                userId_channelId: {
                  userId: userId,
                  channelId: ch.id
                }
              },
              create: {
                userId: userId,
                channelId: ch.id,
                role: "MEMBER"
              },
              update: {} // já é membro, ignora
            })
          )
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
