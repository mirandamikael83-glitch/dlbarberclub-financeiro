import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const { nome, preco, estoque, ativo, ajusteEstoque, imagem_url } = await request.json();

  if (typeof nome === 'string' && nome.trim()) {
    await sql`UPDATE produtos SET nome = ${nome.trim()} WHERE id = ${params.id}`;
  }
  if (typeof preco === 'number') {
    await sql`UPDATE produtos SET preco = ${preco} WHERE id = ${params.id}`;
  }
  if (typeof estoque === 'number') {
    await sql`UPDATE produtos SET estoque = ${estoque} WHERE id = ${params.id}`;
  }
  if (typeof ajusteEstoque === 'number') {
    await sql`UPDATE produtos SET estoque = estoque + ${ajusteEstoque} WHERE id = ${params.id}`;
  }
  if (typeof imagem_url === 'string') {
    await sql`UPDATE produtos SET imagem_url = ${imagem_url || null} WHERE id = ${params.id}`;
  }
  if (typeof ativo === 'boolean') {
    await sql`UPDATE produtos SET ativo = ${ativo} WHERE id = ${params.id}`;
  }

  const { rows } = await sql`SELECT * FROM produtos WHERE id = ${params.id}`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  await sql`DELETE FROM produtos WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
