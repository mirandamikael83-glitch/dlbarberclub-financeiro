import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const { nome, preco, imagem_url, ativo } = await request.json();

  if (typeof nome === 'string' && nome.trim()) {
    await sql`UPDATE servicos SET nome = ${nome.trim()} WHERE id = ${params.id}`;
  }
  if (typeof preco === 'number') {
    await sql`UPDATE servicos SET preco = ${preco} WHERE id = ${params.id}`;
  }
  if (typeof imagem_url === 'string') {
    await sql`UPDATE servicos SET imagem_url = ${imagem_url || null} WHERE id = ${params.id}`;
  }
  if (typeof ativo === 'boolean') {
    await sql`UPDATE servicos SET ativo = ${ativo} WHERE id = ${params.id}`;
  }

  const { rows } = await sql`SELECT * FROM servicos WHERE id = ${params.id}`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  await sql`DELETE FROM servicos WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
