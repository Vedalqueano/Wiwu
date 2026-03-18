import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  ...(process.env.DATABASE_AUTH_TOKEN && { authToken: process.env.DATABASE_AUTH_TOKEN }),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding WiWU Flow database...");

  // ── EMPRESA ────────────────────────────────
  const company = await prisma.company.create({
    data: { name: "WiWU Brasil", slug: "wiwu-brasil" },
  });

  // ── DEPARTAMENTOS ──────────────────────────
  const depts = await Promise.all([
    prisma.department.create({ data: { name: "Logística", slug: "logistica", color: "#E6141E", icon: "📦", companyId: company.id } }),
    prisma.department.create({ data: { name: "Vendas / Loja", slug: "vendas", color: "#7DAA4A", icon: "🛍️", companyId: company.id } }),
    prisma.department.create({ data: { name: "SAC", slug: "sac", color: "#1A3A8F", icon: "🎧", companyId: company.id } }),
    prisma.department.create({ data: { name: "Marketing", slug: "marketing", color: "#B84870", icon: "📣", companyId: company.id } }),
    prisma.department.create({ data: { name: "Financeiro", slug: "financeiro", color: "#C9881A", icon: "💰", companyId: company.id } }),
    prisma.department.create({ data: { name: "TI", slug: "ti", color: "#6B3FA0", icon: "💻", companyId: company.id } }),
  ]);
  const [logistica, vendas, sac, marketing, financeiro] = depts;

  // ── USUÁRIOS (senha: 1234) ─────────────────
  const hash = await bcrypt.hash("1234", 10);

  const users = await Promise.all([
    prisma.user.create({ data: { email: "vitoria@wiwu.com.br", matricula: "001", name: "Vitória", initials: "VI", passwordHash: hash, role: "MANAGER", color: "#050A2D", presence: "ONLINE", companyId: company.id, departmentId: logistica.id, onboarded: true } }),
    prisma.user.create({ data: { email: "joao@wiwu.com.br", matricula: "002", name: "João", initials: "JO", passwordHash: hash, role: "EMPLOYEE", color: "#7DAA4A", presence: "ONLINE", companyId: company.id, departmentId: logistica.id, onboarded: true } }),
    prisma.user.create({ data: { email: "meire@wiwu.com.br", matricula: "003", name: "Meire", initials: "ME", passwordHash: hash, role: "EMPLOYEE", color: "#B84870", presence: "AWAY", companyId: company.id, departmentId: vendas.id, onboarded: true } }),
    prisma.user.create({ data: { email: "cassia@wiwu.com.br", matricula: "004", name: "Cássia", initials: "CA", passwordHash: hash, role: "EMPLOYEE", color: "#C9881A", presence: "OFFLINE", companyId: company.id, departmentId: sac.id, onboarded: true } }),
    prisma.user.create({ data: { email: "mayara@wiwu.com.br", matricula: "005", name: "Mayara", initials: "MA", passwordHash: hash, role: "EMPLOYEE", color: "#1A3A8F", presence: "ONLINE", companyId: company.id, departmentId: marketing.id, onboarded: true } }),
    prisma.user.create({ data: { email: "abbas@wiwu.com.br", matricula: "006", name: "Abbas", initials: "AB", passwordHash: hash, role: "ADMIN", color: "#6B3FA0", presence: "OFFLINE", companyId: company.id, departmentId: financeiro.id, onboarded: true } }),
  ]);
  const [vitoria, joao, meire, , , abbas] = users;

  // ── CANAIS ─────────────────────────────────
  const channels = await Promise.all([
    prisma.channel.create({ data: { name: "geral", slug: "geral", type: "PUBLIC", description: "Canal principal da empresa", companyId: company.id } }),
    prisma.channel.create({ data: { name: "comunicados", slug: "comunicados", type: "ANNOUNCEMENT", description: "Anúncios oficiais", companyId: company.id } }),
    prisma.channel.create({ data: { name: "separação", slug: "separacao", type: "DEPARTMENT", description: "Logística", companyId: company.id, departmentId: logistica.id } }),
    prisma.channel.create({ data: { name: "geral-vendas", slug: "geral-vendas", type: "DEPARTMENT", description: "Vendas", companyId: company.id, departmentId: vendas.id } }),
    prisma.channel.create({ data: { name: "campanhas", slug: "campanhas", type: "DEPARTMENT", description: "Marketing", companyId: company.id, departmentId: marketing.id } }),
    prisma.channel.create({ data: { name: "suporte", slug: "suporte", type: "PUBLIC", description: "SAC", companyId: company.id, departmentId: sac.id } }),
  ]);
  const [geral] = channels;

  // Todos no #geral
  for (const u of users) {
    await prisma.channelMember.create({ data: { channelId: geral.id, userId: u.id } });
  }

  // ── MENSAGENS ──────────────────────────────
  await prisma.message.createMany({
    data: [
      { content: "Bom dia equipe! 🌞", channelId: geral.id, userId: vitoria.id },
      { content: "Bom dia! 3 pedidos separados.", channelId: geral.id, userId: joao.id },
      { content: "Loja aberta, tudo certo ✅", channelId: geral.id, userId: meire.id },
      { content: "KPIs da semana no dashboard 📊", channelId: geral.id, userId: abbas.id },
    ],
  });

  // ── INVENTÁRIO ─────────────────────────────
  await prisma.inventoryItem.createMany({
    data: [
      { sku: "WW-CHG-65W", name: "Carregador USB-C 65W", category: "Carregadores", quantity: 3, minimum: 15, location: "A-01" },
      { sku: "WW-HUB-7C", name: "Hub USB-C 7 em 1", category: "Conectividade", quantity: 41, minimum: 10, location: "A-05" },
      { sku: "WW-FONE-BT", name: "Fone Bluetooth ANC", category: "Áudio", quantity: 11, minimum: 20, location: "C-02" },
      { sku: "WW-MOUSE-W", name: "Mouse Wireless WiWU", category: "Periféricos", quantity: 28, minimum: 10, location: "B-01" },
      { sku: "WW-CABO-TC", name: "Cabo Type-C 2m", category: "Cabos", quantity: 52, minimum: 30, location: "A-02" },
    ],
  });

  // ── TAREFAS ────────────────────────────────
  await prisma.task.createMany({
    data: [
      { title: "Inventário cíclico — Seção 4", status: "TODO", priority: "MEDIUM", creatorId: vitoria.id, assigneeId: joao.id },
      { title: "Separação #4478, #4479", status: "IN_PROGRESS", priority: "URGENT", creatorId: vitoria.id, assigneeId: joao.id },
      { title: "Conferência #4471", status: "DONE", priority: "MEDIUM", creatorId: vitoria.id, assigneeId: joao.id },
    ],
  });

  console.log("✅ Seed completo!");
  console.log(`   ${depts.length} departamentos · ${users.length} usuários · ${channels.length} canais`);
  console.log("   Senha de todos: 1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
