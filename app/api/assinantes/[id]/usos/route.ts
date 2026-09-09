import { sql } from '@vercel/postgres';
import { ensureSchema, PERCENTUAL_COMISSAO_BARBEIRO } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const { barbeiro_id, data } = await request.json();

  if (!barbeiro_id || !data) {
    return NextResponse.json({ error: 'Informe o barbeiro e a data' }, { status: 400 });
  }

  // Pega o pagamento (ciclo) mais recente do assinante
  const { rows: pagamentos } = await sql`
    SELECT * FROM assinatura_pagamentos
    WHERE assinante_id = ${params.id}
    ORDER BY data DESC, id DESC
    LIMIT 1
  `;
  const pagamento = pagamentos[0];
  if (!pagamento) {
    return NextResponse.json(
      { error: 'Este assinante ainda não tem nenhum pagamento registrado. Registre o pagamento do mês primeiro.' },
      { status: 400 }
    );
  }

  const { rows: usosExistentes } = await sql`
    SELECT COUNT(*)::int AS total FROM assinatura_usos WHERE pagamento_id = ${pagamento.id}
  `;
  const usados = usosExistentes[0].total;
  if (usados >= pagamento.cortes_incluidos) {
    return NextResponse.json(
      { error: 'Os cortes deste ciclo já acabaram. Registre um novo pagamento para renovar.' },
      { status: 400 }
    );
  }

  const valorPorCorte = Number(pagamento.valor) / pagamento.cortes_incluidos;
  const valorComissao = valorPorCorte * PERCENTUAL_COMISSAO_BARBEIRO;

  const { rows } = await sql`
    INSERT INTO assinatura_usos (pagamento_id, barbeiro_id, data, valor_comissao)
    VALUES (${pagamento.id}, ${barbeiro_id}, ${data}, ${valorComissao})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
