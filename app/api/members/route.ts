import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { department: { select: { name: true, slug: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      initials: u.initials,
      color: u.color,
      role: u.role,
      presence: u.presence,
      departmentName: u.department?.name || "—",
      departmentSlug: u.department?.slug || "",
      lastSeen: u.lastSeen,
    })));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
