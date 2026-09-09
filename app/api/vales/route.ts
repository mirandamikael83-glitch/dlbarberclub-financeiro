import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');
  const barbeiroId = searchParams.get('barbeiro_id');

  let rows;
  if (barbeiroId) {
    ({ rows } = await sql`
      SELECT v.*, b.nome AS barbeiro_nome
      FROM vales v
      JOIN barbeiros b ON b.id = v.barbeiro_id
      WHERE v.barbeiro_id = ${barbeiroId}
      ORDER BY v.data DESC, v.id DESC
    `);
  } else if (inicio && fim) {
    ({ rows } = await sql`
      SELECT v.*, b.nome AS barbeiro_nome
      FROM vales v
      JOIN barbeiros b ON b.id = v.barbeiro_id
      WHERE v.data BETWEEN ${inicio} AND ${fim}
      ORDER BY v.data DESC, v.id DESC
    `);
  } else {
    ({ rows } = await sql`
      SELECT v.*, b.nome AS barbeiro_nome
      FROM vales v
      JOIN barbeiros b ON b.id = v.barbeiro_id
      ORDER BY v.data DESC, v.id DESC
      LIMIT 200
    `);
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  await ensureSchema();
  const { barbeiro_id, data, valor, forma_pagamento } = await request.json();

  if (!barbeiro_id || !data || !valor) {
    return NextResponse.json({ error: 'Barbeiro, data e valor são obrigatórios' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO vales (barbeiro_id, data, valor, forma_pagamento)
    VALUES (${barbeiro_id}, ${data}, ${valor}, ${forma_pagamento || 'Dinheiro'})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
