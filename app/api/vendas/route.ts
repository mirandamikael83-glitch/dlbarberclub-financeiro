import { sql } from '@vercel/postgres';
import { ensureSchema, PERCENTUAL_COMISSAO_BARBEIRO } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');
  const tipo = searchParams.get('tipo'); // 'atendimento' | 'produto' | null (todos)
  const barbeiroId = searchParams.get('barbeiro_id');

  const condicoes: string[] = [];
  const valores: any[] = [];
  if (inicio && fim) {
    valores.push(inicio, fim);
    condicoes.push(`v.data BETWEEN $${valores.length - 1} AND $${valores.length}`);
  }
  if (tipo) {
    valores.push(tipo);
    condicoes.push(`v.tipo_venda = $${valores.length}`);
  }
  if (barbeiroId) {
    valores.push(barbeiroId);
    condicoes.push(`v.barbeiro_id = $${valores.length}`);
  }
  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
  const limite = inicio && fim ? '' : 'LIMIT 200';

  const { rows: vendas } = await sql.query(
    `SELECT v.*, b.nome AS barbeiro_nome
     FROM vendas v
     JOIN barbeiros b ON b.id = v.barbeiro_id
     ${where}
     ORDER BY v.data DESC, v.id DESC
     ${limite}`,
    valores
  );

  if (vendas.length === 0) return NextResponse.json([]);

  const ids = vendas.map((v: any) => v.id);
  const { rows: itens } = await sql.query(
    `SELECT * FROM itens_venda WHERE venda_id = ANY($1::int[])`,
    [ids]
  );

  const resultado = vendas.map((v: any) => {
    const itensDaVenda = itens.filter((i: any) => i.venda_id === v.id);
    const totalServicos = itensDaVenda
      .filter((i: any) => i.tipo === 'servico')
      .reduce((acc: number, i: any) => acc + Number(i.valor_total), 0);
    const totalProdutos = itensDaVenda
      .filter((i: any) => i.tipo === 'produto')
      .reduce((acc: number, i: any) => acc + Number(i.valor_total), 0);
    const ajuste = Number(v.ajuste) || 0;
    return {
      ...v,
      itens: itensDaVenda,
      total_servicos: totalServicos,
      total_produtos: totalProdutos,
      ajuste,
      total_geral: totalServicos + totalProdutos + ajuste,
      // O ajuste (gorjeta ou desconto) vai inteiro para o barbeiro
      comissao_barbeiro: totalServicos * PERCENTUAL_COMISSAO_BARBEIRO + ajuste,
    };
  });

  return NextResponse.json(resultado);
}

export async function POST(request: Request) {
  await ensureSchema();
  const { data, barbeiro_id, forma_pagamento, itens, ajuste, tipo_venda } = await request.json();

  if (!data || !barbeiro_id || !Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json(
      { error: 'Informe data, barbeiro e ao menos um item (serviço ou produto)' },
      { status: 400 }
    );
  }

  const { rows: vendaRows } = await sql`
    INSERT INTO vendas (data, barbeiro_id, forma_pagamento, ajuste, tipo_venda)
    VALUES (${data}, ${barbeiro_id}, ${forma_pagamento || 'Não informado'}, ${ajuste || 0}, ${tipo_venda || 'atendimento'})
    RETURNING *
  `;
  const venda = vendaRows[0];

  for (const item of itens) {
    const quantidade = item.quantidade || 1;
    const valorUnitario = Number(item.valor_unitario);
    const valorTotal = quantidade * valorUnitario;

    await sql`
      INSERT INTO itens_venda (venda_id, tipo, produto_id, nome, quantidade, valor_unitario, valor_total)
      VALUES (${venda.id}, ${item.tipo}, ${item.produto_id || null}, ${item.nome}, ${quantidade}, ${valorUnitario}, ${valorTotal})
    `;

    if (item.tipo === 'produto' && item.produto_id) {
      await sql`UPDATE produtos SET estoque = estoque - ${quantidade} WHERE id = ${item.produto_id}`;
    }
  }

  return NextResponse.json(venda, { status: 201 });
}
