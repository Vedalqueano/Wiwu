import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess, UserRole } from "@/lib/rbac";
import bcrypt from "bcryptjs";

// Função auxiliar para validar acesso de admin
async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!canAccess(role, "ADMIN")) {
    throw new Error("Unauthorized");
  }
  return session?.user as any;
}

// GET /api/admin/users — Lista todos os usuários
export async function GET() {
  try {
    const adminUser = await requireAdmin();

    // Podemos restringir para que um ADMIN veja apenas usuários da sua company
    const users = await prisma.user.findMany({
      where: { companyId: adminUser.companyId },
      include: {
        department: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/admin/users — Cria um novo usuário
export async function POST(req: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await req.json();

    const { name, email, matricula, role, departmentId } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Gerar iniciais
    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    // Senha padrão "1234"
    const passwordHash = await bcrypt.hash("1234", 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        matricula: matricula || null,
        initials,
        passwordHash,
        role: role || "EMPLOYEE",
        departmentId: departmentId || null,
        companyId: adminUser.companyId,
        color: "#050A2D", // cor padrão
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(newUser);
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    // Verificar erro de unique constraint do Prisma (P2002)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "E-mail ou Matrícula já em uso." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/admin/users — Atualiza role/dept de um usuário
export async function PATCH(req: Request) {
  try {
    const adminUser = await requireAdmin();
    const body = await req.json();

    const { id, role, departmentId, onboarded } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Não permite alterar um SUPER se você não for SUPER (opcional, mas boa prática)
    if (adminUser.role !== "SUPER") {
      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (targetUser?.role === "SUPER") {
        return NextResponse.json({ error: "Apenas Super Admins podem editar outros Super Admins" }, { status: 403 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { 
        id,
        // Garante que só edita usuários da mesma company
        companyId: adminUser.companyId 
      },
      data: {
        ...(role && { role }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(onboarded !== undefined && { onboarded }),
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/admin/users — Remove um usuário
export async function DELETE(req: Request) {
  try {
    const adminUser = await requireAdmin();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    if (id === adminUser.id) {
      return NextResponse.json({ error: "Você não pode excluir sua própria conta" }, { status: 403 });
    }

    await prisma.user.delete({
      where: {
        id,
        companyId: adminUser.companyId
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
