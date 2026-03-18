import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { login } = await req.json();
    if (!login) return NextResponse.json({ error: "Missing login" }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login.toLowerCase() },
          { matricula: login },
        ],
      },
      include: { department: true },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Retornar dados públicos (sem senha)
    return NextResponse.json({
      name: user.name,
      initials: user.initials,
      color: user.color,
      role: user.role === "MANAGER" ? "Gerente" : user.role === "ADMIN" ? "Admin" : user.role === "EMPLOYEE" ? "Funcionário" : user.role,
      departmentSlug: user.department?.slug || "",
      departmentName: user.department?.name || "",
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
