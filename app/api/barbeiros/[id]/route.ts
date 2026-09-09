import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM barbeiros WHERE id = ${params.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const { ativo, nome } = await request.json();

  if (typeof ativo === 'boolean') {
    await sql`UPDATE barbeiros SET ativo = ${ativo} WHERE id = ${params.id}`;
  }
  if (typeof nome === 'string' && nome.trim()) {
    await sql`UPDATE barbeiros SET nome = ${nome.trim()} WHERE id = ${params.id}`;
  }

  const { rows } = await sql`SELECT * FROM barbeiros WHERE id = ${params.id}`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  await sql`DELETE FROM barbeiros WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
