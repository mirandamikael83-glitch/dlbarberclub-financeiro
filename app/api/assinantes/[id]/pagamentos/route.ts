import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const { data } = await request.json();

  const { rows: assinanteRows } = await sql`SELECT * FROM assinantes WHERE id = ${params.id}`;
  const assinante = assinanteRows[0];
  if (!assinante) {
    return NextResponse.json({ error: 'Assinante não encontrado' }, { status: 404 });
  }

  const { rows } = await sql`
    INSERT INTO assinatura_pagamentos (assinante_id, data, valor, cortes_incluidos)
    VALUES (${params.id}, ${data}, ${assinante.valor_plano}, ${assinante.cortes_incluidos})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
