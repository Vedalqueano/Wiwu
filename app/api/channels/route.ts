import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const channels = await prisma.channel.findMany({
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
