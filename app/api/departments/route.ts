import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/departments — lista departamentos da empresa do usuário logado
export async function GET() {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const departments = await prisma.department.findMany({
      where: { companyId: user.companyId },
      select: { id: true, name: true, slug: true, color: true, icon: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(departments);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
