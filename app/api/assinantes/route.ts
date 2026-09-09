import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  await ensureSchema();
  const { rows: assinantes } = await sql`SELECT * FROM assinantes ORDER BY nome ASC`;

  if (assinantes.length === 0) return NextResponse.json([]);

  const ids = assinantes.map((a: any) => a.id);
  const { rows: pagamentos } = await sql.query(
    `SELECT * FROM assinatura_pagamentos WHERE assinante_id = ANY($1::int[]) ORDER BY data DESC, id DESC`,
    [ids]
  );
  const pagamentoIds = pagamentos.map((p: any) => p.id);
  let usos: any[] = [];
  if (pagamentoIds.length > 0) {
    ({ rows: usos } = await sql.query(
      `SELECT u.*, b.nome AS barbeiro_nome FROM assinatura_usos u
       JOIN barbeiros b ON b.id = u.barbeiro_id
       WHERE u.pagamento_id = ANY($1::int[]) ORDER BY u.data DESC`,
      [pagamentoIds]
    ));
  }

  const resultado = assinantes.map((a: any) => {
    const pagamentosDoAssinante = pagamentos.filter((p: any) => p.assinante_id === a.id);
    const ultimoPagamento = pagamentosDoAssinante[0] || null;
    const usosDoUltimoPagamento = ultimoPagamento
      ? usos.filter((u: any) => u.pagamento_id === ultimoPagamento.id)
      : [];
    const cortesRestantes = ultimoPagamento
      ? ultimoPagamento.cortes_incluidos - usosDoUltimoPagamento.length
      : 0;

    return {
      ...a,
      ciclo_atual: ultimoPagamento
        ? {
            pagamento_id: ultimoPagamento.id,
            data_pagamento: ultimoPagamento.data,
            valor_pago: ultimoPagamento.valor,
            cortes_incluidos: ultimoPagamento.cortes_incluidos,
            cortes_usados: usosDoUltimoPagamento.length,
            cortes_restantes: cortesRestantes,
            historico: usosDoUltimoPagamento,
          }
        : null,
    };
  });

  return NextResponse.json(resultado);
}

export async function POST(request: Request) {
  await ensureSchema();
  const { nome, telefone, valor_plano, cortes_incluidos } = await request.json();

  if (!nome || !valor_plano || !cortes_incluidos) {
    return NextResponse.json({ error: 'Nome, valor do plano e nº de cortes são obrigatórios' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO assinantes (nome, telefone, valor_plano, cortes_incluidos)
    VALUES (${nome.trim()}, ${telefone || null}, ${valor_plano}, ${cortes_incluidos})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
