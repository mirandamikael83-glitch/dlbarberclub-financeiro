import { sql } from '@vercel/postgres';
import { ensureSchema } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await ensureSchema();

  // Repõe o estoque dos produtos que faziam parte dessa venda antes de excluir
  const { rows: itens } = await sql`
    SELECT produto_id, quantidade FROM itens_venda
    WHERE venda_id = ${params.id} AND tipo = 'produto' AND produto_id IS NOT NULL
  `;
  for (const item of itens) {
    await sql`UPDATE produtos SET estoque = estoque + ${item.quantidade} WHERE id = ${item.produto_id}`;
  }

  await sql`DELETE FROM vendas WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
