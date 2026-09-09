import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');

  let rows;
  if (inicio && fim) {
    ({ rows } = await sql`
      SELECT * FROM saidas
      WHERE data BETWEEN ${inicio} AND ${fim}
      ORDER BY data DESC, id DESC
    `);
  } else {
    ({ rows } = await sql`SELECT * FROM saidas ORDER BY data DESC, id DESC LIMIT 200`);
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  await ensureSchema();
  const { data, descricao, categoria, valor, forma_pagamento } = await request.json();

  if (!data || !descricao || !valor) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO saidas (data, descricao, categoria, valor, forma_pagamento)
    VALUES (${data}, ${descricao}, ${categoria || 'Geral'}, ${valor}, ${forma_pagamento || 'Dinheiro'})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
