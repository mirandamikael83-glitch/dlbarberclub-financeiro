import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const { nome, telefone, valor_plano, cortes_incluidos, ativo } = await request.json();

  if (typeof nome === 'string' && nome.trim()) {
    await sql`UPDATE assinantes SET nome = ${nome.trim()} WHERE id = ${params.id}`;
  }
  if (typeof telefone === 'string') {
    await sql`UPDATE assinantes SET telefone = ${telefone || null} WHERE id = ${params.id}`;
  }
  if (typeof valor_plano === 'number') {
    await sql`UPDATE assinantes SET valor_plano = ${valor_plano} WHERE id = ${params.id}`;
  }
  if (typeof cortes_incluidos === 'number') {
    await sql`UPDATE assinantes SET cortes_incluidos = ${cortes_incluidos} WHERE id = ${params.id}`;
  }
  if (typeof ativo === 'boolean') {
    await sql`UPDATE assinantes SET ativo = ${ativo} WHERE id = ${params.id}`;
  }

  const { rows } = await sql`SELECT * FROM assinantes WHERE id = ${params.id}`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  try {
    await sql`DELETE FROM assinantes WHERE id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Não foi possível excluir este assinante. Tente novamente.' },
      { status: 400 }
    );
  }
}
