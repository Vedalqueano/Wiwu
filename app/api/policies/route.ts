import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccess } from "@/lib/rbac";

// GET /api/policies?departmentId=xxx  — lista policies
// GET /api/policies?id=xxx            — busca uma específica
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const id = searchParams.get("id");

    if (id) {
      const policy = await prisma.policy.findUnique({
        where: { id },
        include: { department: { select: { id: true, name: true, color: true } } },
      });
      if (!policy) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(policy);
    }

    const where: Record<string, unknown> = { published: true };
    if (departmentId) where.departmentId = departmentId;

    const policies = await prisma.policy.findMany({
      where,
      include: { department: { select: { id: true, name: true, color: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(policies);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/policies — cria policy (MANAGER+)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canAccess(user.role, "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, departmentId, published = false } = body;

    if (!title || !content || !departmentId) {
      return NextResponse.json({ error: "title, content e departmentId são obrigatórios" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const policy = await prisma.policy.create({
      data: { title, slug, content, departmentId, published },
      include: { department: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PATCH /api/policies — atualiza policy (MANAGER+)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canAccess(user.role, "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, content, published, version } = body;

    if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (title !== undefined) {
      data.title = title;
      data.slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    if (content !== undefined) data.content = content;
    if (published !== undefined) data.published = published;
    if (version !== undefined) data.version = version;

    const policy = await prisma.policy.update({
      where: { id },
      data,
      include: { department: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(policy);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// DELETE /api/policies?id=xxx (ADMIN+)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as any;
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canAccess(user.role, "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });

    await prisma.policy.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
