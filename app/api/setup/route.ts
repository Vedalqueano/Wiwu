import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Rota de setup inicial — só funciona quando não há nenhum usuário SUPER no banco.
// Acesse: POST /api/setup com { name, email, password }
// Desative esta rota após criar o primeiro admin (ou ela se auto-desativa quando há um SUPER).

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email e password são obrigatórios." }, { status: 400 });
    }

    // Cria empresa e departamento padrão se não existirem
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { name: "WiWU Brasil", slug: "wiwu-brasil" },
      });
    }

    let dept = await prisma.department.findFirst({ where: { companyId: company.id } });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          name: "Administração",
          slug: "administracao",
          color: "#050A2D",
          icon: "🏢",
          companyId: company.id,
        },
      });
    }

    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((w: string) => w[0].toUpperCase())
      .join("");

    const passwordHash = await bcrypt.hash(password, 10);

    const superExists = await prisma.user.findFirst({ where: { role: "SUPER" } });
    let user;
    if (superExists) {
      user = await prisma.user.update({
        where: { id: superExists.id },
        data: {
          name,
          email: email.toLowerCase(),
          initials,
          passwordHash,
          companyId: company.id,
          departmentId: dept.id,
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          initials,
          passwordHash,
          role: "SUPER",
          color: "#050A2D",
          onboarded: true,
          companyId: company.id,
          departmentId: dept.id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Usuário SUPER criado: ${user.email}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const superExists = await prisma.user.findFirst({ where: { role: "SUPER" } });
  return NextResponse.json({
    setupRequired: !superExists,
    message: superExists
      ? "Sistema já configurado. Faça login normalmente."
      : "Nenhum usuário SUPER encontrado. Faça um POST em /api/setup para criar o primeiro admin.",
  });
}
