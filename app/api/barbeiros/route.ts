import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  await ensureSchema();
  const { rows } = await sql`SELECT * FROM barbeiros ORDER BY nome ASC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  await ensureSchema();
  const { nome } = await request.json();

  if (!nome || typeof nome !== 'string' || !nome.trim()) {
    return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
  }

  const { rows } = await sql`
    INSERT INTO barbeiros (nome) VALUES (${nome.trim()}) RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}
