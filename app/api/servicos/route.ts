import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM servicos ORDER BY nome ASC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  await ensureSchema();
  const { nome, preco, imagem_url } = await request.json();

  if (!nome || typeof nome !== 'string' || !nome.trim() || !preco) {
    return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO servicos (nome, preco, imagem_url)
    VALUES (${nome.trim()}, ${preco}, ${imagem_url || null})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
