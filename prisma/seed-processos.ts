/**
 * Seed: Processos do Manual WiWU Flow
 * Popula o Knowledge Base (Policy) com os 17 processos extraídos do PDF.
 *
 * Uso: npx tsx prisma/seed-processos.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  ...(process.env.DATABASE_AUTH_TOKEN && { authToken: process.env.DATABASE_AUTH_TOKEN }),
});
const prisma = new PrismaClient({ adapter });

// Departamentos que precisam existir (slug → nome)
const DEPARTMENTS = [
  { slug: "logistica", name: "Logística", color: "#0EA5E9" },
  { slug: "loja-vendas", name: "Loja / Vendas", color: "#10B981" },
  { slug: "gestao", name: "Gestão", color: "#6366F1" },
  { slug: "garantia-sac", name: "Garantia / SAC", color: "#EF4444" },
];

// Processos do PDF (slug, título, departamento slug, conteúdo markdown)
const PROCESSOS: { slug: string; title: string; dept: string; content: string }[] = [
  // ── LOGÍSTICA ──────────────────────────────────────
  {
    slug: "separacao-a",
    title: "Separação A — Cliente retira / paga na loja",
    dept: "logistica",
    content: `## Separação A — Cliente retira / paga na loja

**Frequência:** Diário | **Responsável:** Atendente | **Tipo:** Operacional

Fluxo quando o cliente comparece presencialmente para pagar ou retirar o pedido.

### 1. Cliente vem retirar ou pagar na loja
Receber o cliente e identificar a modalidade da operação.
- Confirmar se é retirada ou pagamento presencial
- Verificar se o pedido já está separado no sistema

**Responsável:** Atendente

### 2. Imprimir o pedido
Gerar e imprimir o comprovante do pedido antes de iniciar a separação.
- Acessar o pedido pelo número ou CPF
- Imprimir nota / comprovante

**Responsável:** Atendente

### 3. Processar pagamento
Confirmar e processar o pagamento na modalidade escolhida.
- Débito, crédito, Pix ou dinheiro
- Emitir comprovante de pagamento

**Responsável:** Atendente

### 4. Retirada confirmada
Entregar o produto ao cliente e finalizar o atendimento.
- Entregar o produto com a nota
- Registrar saída no sistema

**Responsável:** Atendente`,
  },
  {
    slug: "separacao-b",
    title: "Separação B — Pedido remoto (já pago)",
    dept: "logistica",
    content: `## Separação B — Pedido remoto (já pago)

**Frequência:** Diário | **Responsável:** Equipe Logística | **Tipo:** Operacional

Fluxo para pedidos realizados remotamente com pagamento já confirmado.

### 1. Confirmação de pagamento recebida
Verificar no sistema que o pagamento foi confirmado antes de iniciar.
- Checar status do pagamento
- Confirmar modalidade de envio

**Responsável:** Atendente

### 2. Definir tipo de envio
Determinar a modalidade: Correios, Motoboy, Braspress ou Retirada.
- Confirmar endereço do destinatário
- Escolher transportadora conforme região e valor

**Responsável:** Atendente

### 3. Imprimir o pedido
Imprimir o pedido e a etiqueta de envio.
- Gerar etiqueta de envio
- Imprimir nota fiscal

**Responsável:** Atendente

### 4. Fixar pedido no sistema
Registrar que o pedido está separado e pronto para envio.
- Atualizar status para "Em separação"
- Encaminhar para conferência

**Responsável:** Atendente`,
  },
  {
    slug: "separacao-c",
    title: "Separação C — Falta de produto",
    dept: "logistica",
    content: `## Separação C — Falta de produto

**Frequência:** Sob demanda | **Responsável:** Atendente → Supervisor | **Tipo:** Exceção

Procedimento quando um produto do pedido não está disponível em estoque.

> **Atenção:** Nunca enviar um pedido com item faltando sem comunicar o cliente e registrar a ocorrência.

### 1. Identificar a falta durante a separação
Ao bipar os itens, constatar que um produto não está disponível.
- Registrar o SKU do item faltante
- Verificar se há em outro setor ou depósito

**Responsável:** Estoque

### 2. Realizar solicitação do produto
Acionar o canal de reposição imediatamente.
- Notificar o Supervisor via sistema
- Registrar ocorrência no relatório do dia

**Responsável:** Atendente

### 3. Supervisor escalona para WiWU Office
O supervisor analisa e aciona o fornecedor para reposição urgente.
- Comunicar ao cliente sobre o atraso
- Informar prazo estimado de reposição

**Responsável:** Supervisor

### 4. Pedido finalizado e encaminhado à Conferência
Após chegada do produto, concluir a separação normalmente.
- Bipar item reposto
- Encaminhar para conferência final

**Responsável:** Equipe Logística`,
  },
  {
    slug: "conferencia-pos-separacao",
    title: "Conferência pós-separação",
    dept: "logistica",
    content: `## Conferência pós-separação

**Frequência:** A cada pedido | **Responsável:** Conferente | **Tipo:** Controle

Verificação final antes do despacho: itens, nota fiscal e destino corretos.

### 1. Bipar o pedido
Passar o leitor no código do pedido para abrir a conferência.
- Localizar o pedido na fila
- Bipar o código de barras do pacote

**Responsável:** Conferente

### 2. Dar pedido — fazer nota fiscal
Emitir a NF-e e associar ao pedido antes de despachar.
- Verificar dados do destinatário
- Emitir NF-e no sistema
- Imprimir ou enviar por e-mail

**Responsável:** Atendente

### 3. Destinar envio e citar modalidade
Confirmar e registrar a modalidade de envio no sistema.
- Confirmar endereço de entrega
- Registrar transportadora no sistema

**Responsável:** Atendente

### 4. Rodar número do pedido no sistema
Executar o processamento final para gerar protocolo de rastreio.
- Acessar módulo de despacho
- Gerar código de rastreio
- Registrar na plataforma de venda

**Responsável:** Atendente

### 5. Arquivar ficha do pedido
Guardar o comprovante físico e finalizar o processo.
- Carimbar com data e hora
- Arquivar na pasta do dia

**Responsável:** Atendente`,
  },
  {
    slug: "troca-varejo",
    title: "Troca — Varejo",
    dept: "logistica",
    content: `## Troca — Varejo

**Frequência:** Sob demanda | **Responsável:** Atendente | **Tipo:** Atendimento

Processo de troca para clientes do varejo por teste, compra errada ou insatisfação.

> **Atenção:** Não existe tabela de preços fixa para varejo. Sempre consultar o valor atualizado no sistema antes de finalizar.

### 1. Identificar motivo: teste ou compra errada
Entender e registrar o motivo antes de iniciar o processo.
- Conversar com o cliente e registrar o motivo
- Preencher o formulário de troca

**Responsável:** Atendente

### 2. Verificar que não há tabela de varejo
Consultar o valor atual do produto no sistema.
- Acessar o produto no sistema
- Confirmar preço atual vigente
- Calcular diferença de valor se houver

**Responsável:** Atendente

### 3. Analisar e aprovar a troca
Verificar estado do produto devolvido e aprovar.
- Inspecionar estado do produto
- Verificar se está em condições de revenda
- Autorizar internamente

**Responsável:** Supervisor

### 4. Finalizar a troca no sistema
Registrar a troca aprovada e entregar o novo produto.
- Dar baixa no item devolvido
- Registrar saída do novo produto
- Emitir comprovante para o cliente

**Responsável:** Atendente`,
  },
  {
    slug: "troca-atacado",
    title: "Troca — Atacado",
    dept: "logistica",
    content: `## Troca — Atacado

**Frequência:** Sob demanda | **Responsável:** Equipe Logística | **Tipo:** Atendimento

Troca para clientes do atacado com análise de quantidade e condição dos itens.

### 1. Realizar teste do produto
Testar individualmente cada produto devolvido.
- Ligar / conectar cada produto
- Documentar defeito com foto se necessário

**Responsável:** Técnico

### 2. Verificar quantidade
Conferir a quantidade devolvida com a nota de compra original.
- Bipar todos os itens devolvidos
- Conferir com a NF original
- Registrar divergências

**Responsável:** Estoque

### 3. Analisar se a troca é procedente
Avaliar com base nos testes e na política de troca atacado.
- Verificar prazo de garantia (90 dias)
- Confirmar que o defeito não é por mau uso
- Consultar supervisor em caso de dúvida

**Responsável:** Supervisor

### 4. Finalizar a troca no sistema
Registrar a troca aprovada e emitir nota de troca.
- Registrar no sistema
- Separar novos produtos
- Emitir NF de troca
- Notificar o cliente

**Responsável:** Atendente`,
  },
  {
    slug: "envio-correios",
    title: "Envio — Correios",
    dept: "logistica",
    content: `## Envio — Correios

**Frequência:** Diário | **Responsável:** Equipe Logística | **Tipo:** Operacional

Fluxo completo para despacho via Correios, do pacote ao rastreio enviado ao cliente.

### 1. Enviar o produto até os Correios
Levar o pacote embalado e etiquetado à agência ou aguardar coleta.
- Verificar embalagem e lacre
- Confirmar etiqueta colada
- Levar à agência ou agendar coleta

**Responsável:** Equipe Logística

### 2. Gerar e registrar comprovante de envio
Solicitar comprovante dos Correios e registrar no pedido.
- Solicitar comprovante no balcão
- Fotografar ou digitalizar
- Salvar no sistema do pedido

**Responsável:** Atendente

### 3. Enviar rastreio ao cliente
Comunicar o código de rastreio via WhatsApp ou e-mail.
- Copiar código de rastreio (ex: BR123456789BR)
- Enviar via WhatsApp ou e-mail
- Registrar envio no sistema

**Responsável:** Atendente

### 4. Anexar comprovante ao pedido
Vincular o comprovante e atualizar o status.
- Acessar o pedido no sistema
- Upload do comprovante
- Atualizar para "Enviado"

**Responsável:** Atendente`,
  },
  {
    slug: "envio-motoboy-taxi",
    title: "Envio — Motoboy / Táxi",
    dept: "logistica",
    content: `## Envio — Motoboy / Táxi

**Frequência:** Sob demanda | **Responsável:** Equipe Logística | **Tipo:** Operacional

Envio local por motoboy ou táxi com código de confirmação de retirada.

### 1. Retirada mediante código de confirmação
O entregador apresenta o código de coleta para liberar o pacote.
- Solicitar o código ao entregador
- Verificar no sistema se o código confere
- Liberar o pacote após confirmação

**Responsável:** Atendente

### 2. Enviar comprovante de entrega
Após entrega, registrar o comprovante no sistema.
- Receber foto ou assinatura do entregador
- Salvar comprovante no pedido

**Responsável:** Atendente

### 3. Confirmar entrega ao cliente
Notificar o cliente que o pedido foi entregue.
- Enviar mensagem de confirmação
- Registrar status "Entregue" no sistema

**Responsável:** Atendente`,
  },
  {
    slug: "envio-braspress",
    title: "Envio — Braspress (Transportadora)",
    dept: "logistica",
    content: `## Envio — Braspress (Transportadora)

**Frequência:** Sob demanda | **Responsável:** Equipe Logística | **Tipo:** Operacional

Envio via Braspress para atacado ou clientes fora da região.

### 1. Coletar todos os dados de entrega
Reunir dados completos para emissão do CTE.
- Nome completo do destinatário
- CNPJ / CPF
- Endereço completo com CEP
- Peso e dimensões do pacote
- Valor declarado da mercadoria

**Responsável:** Atendente

### 2. Solicitar coleta na plataforma Braspress
Acessar o portal e registrar a coleta.
- Acessar portal Braspress
- Preencher dados do remetente e destinatário
- Confirmar agendamento
- Imprimir nota de despacho

**Responsável:** Atendente`,
  },

  // ── LOJA / VENDAS ──────────────────────────────────
  {
    slug: "inventario-ciclico",
    title: "Inventário cíclico",
    dept: "loja-vendas",
    content: `## Inventário cíclico

**Frequência:** Terças e Sextas | **Responsável:** João | **Tipo:** Controle

Contagem periódica de produtos duas vezes por semana para manter a acurácia do estoque.

> **Atenção:** Inventário cíclico: Terças e Sextas. Inventário trimestral exige agendamento prévio com a gerência.

### 1. Bater código com o pedido
Usar o leitor para contar e confirmar cada item da seção definida.
- Definir seção do inventário do dia
- Bipar cada produto na prateleira
- Registrar quantidades no sistema

**Responsável:** João

### 2. Verificar divergências
Comparar a contagem física com o saldo do sistema.
- Gerar relatório de divergências
- Verificar itens com diferença positiva ou negativa
- Bipar novamente em caso de dúvida

**Responsável:** João

### 3. Comunicar divergências imediatamente
Reportar qualquer divergência à gerência.
- Notificar via sistema ou mensagem
- Registrar ocorrência no relatório diário
- Aguardar orientação para ajuste

**Responsável:** João → Vitória`,
  },
  {
    slug: "abastecimento-diario",
    title: "Abastecimento diário / Reposição",
    dept: "loja-vendas",
    content: `## Abastecimento diário / Reposição

**Frequência:** Diário | **Responsável:** Equipe Loja | **Tipo:** Operacional

Reposição diária dos produtos nas prateleiras para garantir disponibilidade.

### 1. Verificar produtos a repor
Identificar quais produtos estão abaixo do mínimo.
- Verificar checklist no sistema
- Identificar visualmente prateleiras vazias
- Anotar SKUs para reposição

**Responsável:** Equipe Loja

### 2. Armazenar devidamente
Retirar do estoque e organizar conforme layout da loja.
- Respeitar organização por seção e categoria
- FIFO: produtos mais antigos na frente
- Verificar estado dos itens
- Etiquetas de preço visíveis

**Responsável:** Equipe Loja

### 3. Finalizar no checklist
Marcar itens repostos como concluídos no sistema.
- Atualizar checklist do turno
- Registrar quantidade reposta
- Assinar relatório de abastecimento

**Responsável:** Equipe Loja`,
  },
  {
    slug: "analise-estoque-pedido-semanal",
    title: "Análise de estoque — Pedido semanal",
    dept: "loja-vendas",
    content: `## Análise de estoque — Pedido semanal

**Frequência:** Toda segunda-feira | **Responsável:** Vitória / Estoque | **Tipo:** Planejamento

Revisão semanal do estoque para gerar pedido de reposição ao fornecedor WiWU.

> **Atenção:** Pedido de reposição realizado toda segunda-feira. Produtos abaixo do mínimo devem ser sinalizados com urgência.

### 1. Levantar estoque atual
Gerar relatório de posição de estoque para todos os SKUs.
- Acessar relatório de estoque
- Filtrar produtos abaixo do mínimo
- Exportar lista para análise

**Responsável:** João

### 2. Definir pedido de reposição
Com base no histórico de vendas, definir quantidades a pedir.
- Analisar giro dos últimos 7 dias
- Calcular quantidade ideal por SKU
- Montar lista de compra

**Responsável:** Vitória

### 3. Enviar pedido ao fornecedor
Enviar o pedido de reposição para a WiWU Office.
- Revisar pedido com Vitória
- Enviar via sistema ou e-mail oficial
- Registrar número do pedido gerado

**Responsável:** Vitória → WiWU`,
  },
  {
    slug: "envio-wiwu-produto-loja",
    title: "Envio WiWU — Produto da loja",
    dept: "loja-vendas",
    content: `## Envio WiWU — Produto da loja

**Frequência:** Sob demanda | **Responsável:** Equipe Loja | **Tipo:** Operacional

Procedimento para dar saída no sistema quando um produto da loja é solicitado para envio interno.

### 1. Verificar solicitação e autorização
Confirmar que o envio foi autorizado pela gerência.
- Verificar autorização da Vitória
- Confirmar produto e quantidade solicitada

**Responsável:** Atendente

### 2. Dar saída no sistema imediatamente
Registrar a saída do produto no sistema de estoque.
- Acessar módulo de movimentação
- Registrar saída com justificativa
- Confirmar saldo atualizado no sistema

**Responsável:** Atendente`,
  },

  // ── GESTÃO ─────────────────────────────────────────
  {
    slug: "reuniao-semanal",
    title: "Reunião semanal e pontos de atenção",
    dept: "gestao",
    content: `## Reunião semanal e pontos de atenção

**Frequência:** Segunda + Terça | **Responsável:** Vitória / Abbas | **Tipo:** Gestão

Reunião de alinhamento toda segunda-feira e pontos de atenção toda terça com toda a equipe.

> **Atenção:** Reunião semanal: toda segunda-feira. Pontos de atenção: toda terça-feira. Presença obrigatória.

### 1. Abbas prepara KPIs e pauta
Antes da reunião, Abbas consolida indicadores e pontos a discutir.
- Consolidar KPIs da semana anterior
- Levantar pendências não resolvidas
- Enviar pauta para a equipe

**Responsável:** Abbas

### 2. Conduzir a reunião — segunda-feira
Vitória conduz o alinhamento semanal com toda a equipe.
- Apresentar resultados da semana
- Discutir problemas e soluções
- Alinhar metas da semana corrente
- Registrar decisões

**Responsável:** Vitória

### 3. Pontos de atenção — terça-feira
Revisão dos pontos identificados na reunião e ações em andamento.
- Verificar andamento das ações definidas na segunda
- Resolver pendências urgentes
- Comunicar novidades

**Responsável:** Vitória + Equipe

### 4. Registrar ata e ações
Documentar as decisões tomadas e atribuir responsáveis.
- Registrar ata no sistema
- Atribuir responsáveis e prazos
- Distribuir para toda a equipe

**Responsável:** Abbas`,
  },
  {
    slug: "renovacao-vitrine",
    title: "Renovação de vitrine",
    dept: "gestao",
    content: `## Renovação de vitrine

**Frequência:** A cada 15 dias | **Responsável:** Vitória | **Tipo:** Visual Merchandising

Atualização periódica da vitrine da loja para manter o ambiente atrativo.

### 1. Selecionar produtos para destaque
Escolher os produtos com foco em lançamentos e boa margem.
- Priorizar lançamentos WiWU
- Verificar disponibilidade em estoque
- Definir posicionamento

**Responsável:** Vitória

### 2. Montar a vitrine
Retirar os produtos antigos e dispor os novos.
- Limpar e organizar o espaço
- Posicionar conforme layout
- Verificar iluminação e preço visíveis

**Responsável:** Equipe Loja

### 3. Registrar e comunicar
Fotografar e comunicar a atualização para a equipe.
- Fotografar antes e depois
- Enviar fotos ao grupo da equipe
- Registrar no sistema

**Responsável:** Vitória`,
  },

  // ── GARANTIA / SAC ─────────────────────────────────
  {
    slug: "termo-garantia",
    title: "Termo de garantia",
    dept: "garantia-sac",
    content: `## Termo de garantia

**Frequência:** Sob demanda | **Responsável:** Cássia / SAC | **Tipo:** Atendimento

Procedimento para registrar e processar a garantia de produto WiWU com embalagem e número de série.

> **Atenção:** Garantia WiWU: 90 dias. Preencher no ato com embalagem e número de série documentados.

### 1. Verificar embalagem
Inspecionar e registrar o estado da embalagem original.
- Confirmar se a embalagem está presente
- Verificar lacres e condição geral
- Documentar e fotografar

**Responsável:** Cássia

### 2. Registrar número de série
Localizar e anotar o número de série para validar a garantia.
- Localizar número de série no produto ou embalagem
- Confirmar com a nota fiscal original
- Registrar no formulário de garantia

**Responsável:** Cássia

### 3. Analisar e processar
Verificar validade da garantia e determinar o procedimento.
- Confirmar prazo de 90 dias a partir da compra
- Verificar se o defeito não é por mau uso
- Definir: troca imediata, envio ao fabricante ou reembolso

**Responsável:** Cássia → Vitória

### 4. Finalizar atendimento
Concluir o processo e comunicar o cliente.
- Registrar conclusão no sistema
- Notificar o cliente sobre a decisão
- Arquivar documentação

**Responsável:** Cássia`,
  },
  {
    slug: "atendimento-cliente",
    title: "Atendimento ao cliente",
    dept: "garantia-sac",
    content: `## Atendimento ao cliente

**Frequência:** Contínuo | **Responsável:** Cássia / SAC | **Tipo:** Atendimento

Processo padrão de atendimento para dúvidas, reclamações, trocas e solicitações.

### 1. Registrar contato e abrir ticket
Registrar o contato do cliente no sistema de atendimento.
- Abrir ticket no sistema
- Identificar o cliente
- Registrar canal e assunto

**Responsável:** Cássia

### 2. Identificar e classificar a demanda
Entender o que o cliente precisa e categorizar.
- Ouvir ativamente
- Classificar: dúvida, reclamação, troca ou garantia
- Priorizar conforme urgência

**Responsável:** Cássia

### 3. Resolver ou escalar
Resolver internamente ou acionar o setor responsável.
- Verificar se resolve na hora
- Se necessário, acionar Logística ou Gestão
- Registrar encaminhamento no ticket

**Responsável:** Cássia

### 4. Encerrar e registrar NPS
Concluir o atendimento e registrar a satisfação.
- Confirmar resolução com o cliente
- Registrar conclusão no sistema
- Solicitar avaliação do atendimento

**Responsável:** Cássia`,
  },
];

async function main() {
  // Buscar a empresa (primeira)
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error("Nenhuma empresa encontrada. Execute o setup primeiro.");
    process.exit(1);
  }

  console.log(`Empresa: ${company.name} (${company.id})`);

  // Criar ou buscar departamentos
  const deptMap: Record<string, string> = {};
  for (const dept of DEPARTMENTS) {
    const existing = await prisma.department.findFirst({
      where: { companyId: company.id, slug: dept.slug },
    });
    if (existing) {
      deptMap[dept.slug] = existing.id;
      console.log(`  Departamento existente: ${dept.name} (${existing.id})`);
    } else {
      const created = await prisma.department.create({
        data: {
          name: dept.name,
          slug: dept.slug,
          color: dept.color,
          companyId: company.id,
        },
      });
      deptMap[dept.slug] = created.id;
      console.log(`  Departamento criado: ${dept.name} (${created.id})`);
    }
  }

  // Criar processos (policies)
  let created = 0;
  let skipped = 0;
  for (const proc of PROCESSOS) {
    const departmentId = deptMap[proc.dept];
    if (!departmentId) {
      console.error(`  Departamento não encontrado: ${proc.dept}`);
      continue;
    }

    const existing = await prisma.policy.findFirst({
      where: { slug: proc.slug, departmentId },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.policy.create({
      data: {
        title: proc.title,
        slug: proc.slug,
        content: proc.content,
        published: true,
        departmentId,
      },
    });
    created++;
  }

  console.log(`\nProcessos criados: ${created} | Já existiam: ${skipped}`);
  console.log("Seed concluído!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
