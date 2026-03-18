import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/rbac";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!canAccess(role, "ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session?.user as any;
}

// GET /api/admin/departments — Lista departamentos da empresa do admin
export async function GET() {
  try {
    const adminUser = await requireAdmin();

    const depts = await prisma.department.findMany({
      where: { companyId: adminUser.companyId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(depts);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
