import { sql } from '@vercel/postgres';

// Roda as conferências de tabela só uma vez por instância do servidor —
// evita repetir ~15 comandos SQL a cada clique, que estava deixando tudo lento.
let schemaPronto: Promise<void> | null = null;

export async function ensureSchema() {
  if (!schemaPronto) {
    schemaPronto = criarSchema().catch((err) => {
      schemaPronto = null; // se der erro, tenta de novo na próxima
      throw err;
    });
  }
  return schemaPronto;
}

async function criarSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS barbeiros (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      preco NUMERIC(10,2) NOT NULL,
      estoque INTEGER NOT NULL DEFAULT 0,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      imagem_url TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagem_url TEXT;`;

  // Catálogo de serviços (corte normal, corte e sobrancelha, plano mensal, etc.)
  await sql`
    CREATE TABLE IF NOT EXISTS servicos (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      preco NUMERIC(10,2) NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      imagem_url TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // "vendas" é o cabeçalho de um atendimento no caixa (PDV):
  // um barbeiro, uma forma de pagamento, e um ou mais itens (serviço e/ou produtos).
  await sql`
    CREATE TABLE IF NOT EXISTS vendas (
      id SERIAL PRIMARY KEY,
      data DATE NOT NULL,
      barbeiro_id INTEGER NOT NULL REFERENCES barbeiros(id),
      forma_pagamento TEXT NOT NULL DEFAULT 'Não informado',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS itens_venda (
      id SERIAL PRIMARY KEY,
      venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('servico', 'produto')),
      produto_id INTEGER REFERENCES produtos(id),
      nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      valor_unitario NUMERIC(10,2) NOT NULL,
      valor_total NUMERIC(10,2) NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS saidas (
      id SERIAL PRIMARY KEY,
      data DATE NOT NULL,
      descricao TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'Geral',
      valor NUMERIC(10,2) NOT NULL,
      forma_pagamento TEXT NOT NULL DEFAULT 'Dinheiro',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE saidas ADD COLUMN IF NOT EXISTS forma_pagamento TEXT NOT NULL DEFAULT 'Dinheiro';`;
  await sql`ALTER TABLE vendas ADD COLUMN IF NOT EXISTS tipo_venda TEXT NOT NULL DEFAULT 'atendimento';`;
  await sql`ALTER TABLE vendas ADD COLUMN IF NOT EXISTS ajuste NUMERIC(10,2) NOT NULL DEFAULT 0;`;

  // Vale: adiantamento dado ao barbeiro, para descontar da comissão dele depois
  await sql`
    CREATE TABLE IF NOT EXISTS vales (
      id SERIAL PRIMARY KEY,
      barbeiro_id INTEGER NOT NULL REFERENCES barbeiros(id),
      data DATE NOT NULL,
      valor NUMERIC(10,2) NOT NULL,
      forma_pagamento TEXT NOT NULL DEFAULT 'Dinheiro',
      quitado BOOLEAN NOT NULL DEFAULT FALSE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`ALTER TABLE vales ADD COLUMN IF NOT EXISTS forma_pagamento TEXT NOT NULL DEFAULT 'Dinheiro';`;

  // Assinantes de plano mensal (ex: R$100 = 4 cortes no mês)
  await sql`
    CREATE TABLE IF NOT EXISTS assinantes (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      telefone TEXT,
      valor_plano NUMERIC(10,2) NOT NULL,
      cortes_incluidos INTEGER NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Cada pagamento mensal do assinante abre um novo "ciclo" com N cortes disponíveis
  await sql`
    CREATE TABLE IF NOT EXISTS assinatura_pagamentos (
      id SERIAL PRIMARY KEY,
      assinante_id INTEGER NOT NULL REFERENCES assinantes(id) ON DELETE CASCADE,
      data DATE NOT NULL,
      valor NUMERIC(10,2) NOT NULL,
      cortes_incluidos INTEGER NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  // Corrige bancos criados antes desta regra existir, para excluir assinante não travar mais
  await sql`ALTER TABLE assinatura_pagamentos DROP CONSTRAINT IF EXISTS assinatura_pagamentos_assinante_id_fkey;`;
  await sql`
    ALTER TABLE assinatura_pagamentos
    ADD CONSTRAINT assinatura_pagamentos_assinante_id_fkey
    FOREIGN KEY (assinante_id) REFERENCES assinantes(id) ON DELETE CASCADE;
  `;

  // Cada corte usado dentro de um ciclo de pagamento, com a comissão do barbeiro daquele corte
  await sql`
    CREATE TABLE IF NOT EXISTS assinatura_usos (
      id SERIAL PRIMARY KEY,
      pagamento_id INTEGER NOT NULL REFERENCES assinatura_pagamentos(id) ON DELETE CASCADE,
      barbeiro_id INTEGER NOT NULL REFERENCES barbeiros(id),
      data DATE NOT NULL,
      valor_comissao NUMERIC(10,2) NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

// Percentual de comissão do barbeiro — vale só sobre SERVIÇOS (cortes),
// não sobre venda de produtos (coca, cerveja, pomada etc.), que fica 100% pra barbearia.
export const PERCENTUAL_COMISSAO_BARBEIRO = 0.5;
