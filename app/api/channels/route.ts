import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    const role = (session?.user as any)?.role as string | undefined;

    const isSuper = role === "SUPER";

    // SUPER vê tudo; demais usuários veem canais públicos + seus próprios DMs
    const channels = await prisma.channel.findMany({
      where: isSuper || !userId ? undefined : {
        OR: [
          { type: { not: "DIRECT" } },
          { type: "DIRECT", members: { some: { userId } } },
        ],
      },
      include: {
        department: { select: { name: true } },
        _count: { select: { messages: true, members: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(channels.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: c.type,
      description: c.description,
      departmentName: c.department?.name,
      messageCount: c._count.messages,
      memberCount: c._count.members,
    })));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
