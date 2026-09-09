import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  await sql`DELETE FROM saidas WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
