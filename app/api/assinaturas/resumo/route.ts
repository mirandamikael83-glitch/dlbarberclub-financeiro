import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');

  let pagamentos, usos;

  if (inicio && fim) {
    ({ rows: pagamentos } = await sql`
      SELECT p.*, a.nome AS assinante_nome
      FROM assinatura_pagamentos p
      JOIN assinantes a ON a.id = p.assinante_id
      WHERE p.data BETWEEN ${inicio} AND ${fim}
    `);
    ({ rows: usos } = await sql`
      SELECT u.*, b.nome AS barbeiro_nome, a.nome AS assinante_nome
      FROM assinatura_usos u
      JOIN barbeiros b ON b.id = u.barbeiro_id
      JOIN assinatura_pagamentos p ON p.id = u.pagamento_id
      JOIN assinantes a ON a.id = p.assinante_id
      WHERE u.data BETWEEN ${inicio} AND ${fim}
    `);
  } else {
    ({ rows: pagamentos } = await sql`
      SELECT p.*, a.nome AS assinante_nome FROM assinatura_pagamentos p JOIN assinantes a ON a.id = p.assinante_id
    `);
    ({ rows: usos } = await sql`
      SELECT u.*, b.nome AS barbeiro_nome, a.nome AS assinante_nome
      FROM assinatura_usos u
      JOIN barbeiros b ON b.id = u.barbeiro_id
      JOIN assinatura_pagamentos p ON p.id = u.pagamento_id
      JOIN assinantes a ON a.id = p.assinante_id
    `);
  }

  return NextResponse.json({ pagamentos, usos });
}
