import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const { quitado } = await request.json();

  if (typeof quitado === 'boolean') {
    await sql`UPDATE vales SET quitado = ${quitado} WHERE id = ${params.id}`;
  }

  const { rows } = await sql`SELECT * FROM vales WHERE id = ${params.id}`;
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  await sql`DELETE FROM vales WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
