'use client';

import { useEffect, useState } from 'react';

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

type Barbeiro = { id: number; nome: string; ativo: boolean };
type Produto = { id: number; nome: string; preco: string; estoque: number; ativo: boolean; imagem_url: string | null };
type ItemCarrinho = { produto_id: number; nome: string; quantidade: number; valor_unitario: number };
type Venda = {
  id: number;
  data: string;
  barbeiro_nome: string;
  forma_pagamento: string;
  tipo_venda: string;
  itens: { nome: string; quantidade: number; valor_total: string }[];
  total_geral: number;
};

export default function VendasProdutosPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);

  const [data, setData] = useState(hoje());
  const [barbeiroId, setBarbeiroId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  async function carregarCatalogo() {
    const [b, p] = await Promise.all([
      fetch('/api/barbeiros').then((r) => r.json()),
      fetch('/api/produtos').then((r) => r.json()),
    ]);
    setBarbeiros(b);
    setProdutos(p);
  }

  async function carregarVendas() {
    const v = await fetch('/api/vendas').then((r) => r.json());
    setVendas(v);
    setUltimaAtualizacao(new Date());
  }

  async function carregar() {
    await Promise.all([carregarCatalogo(), carregarVendas()]);
  }

  useEffect(() => {
    carregar();
    const intervalo = setInterval(() => {
      carregarVendas();
      carregarCatalogo();
    }, 15000);
    return () => clearInterval(intervalo);
  }, []);

  function adicionarAoCarrinho(produto: Produto) {
    const existente = carrinho.findIndex((i) => i.produto_id === produto.id);
    if (existente >= 0) {
      const copia = [...carrinho];
      copia[existente].quantidade += 1;
      setCarrinho(copia);
    } else {
      setCarrinho([
        ...carrinho,
        { produto_id: produto.id, nome: produto.nome, quantidade: 1, valor_unitario: Number(produto.preco) },
      ]);
    }
  }

  function alterarQuantidade(index: number, delta: number) {
    const copia = [...carrinho];
    copia[index].quantidade += delta;
    if (copia[index].quantidade <= 0) copia.splice(index, 1);
    setCarrinho(copia);
  }

  const totalCarrinho = carrinho.reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0);

  async function finalizarVenda() {
    if (!barbeiroId) {
      alert('Selecione quem vendeu.');
      return;
    }
    if (carrinho.length === 0) {
      alert('Adicione ao menos um produto.');
      return;
    }
    setSalvando(true);
    await fetch('/api/vendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data,
        barbeiro_id: barbeiroId,
        forma_pagamento: formaPagamento,
        tipo_venda: 'produto',
        itens: carrinho.map((i) => ({
          tipo: 'produto',
          produto_id: i.produto_id,
          nome: i.nome,
          quantidade: i.quantidade,
          valor_unitario: i.valor_unitario,
        })),
      }),
    });
    setCarrinho([]);
    setSalvando(false);
    carregar();
  }

  async function excluirVenda(id: number) {
    if (!confirm('Excluir esta venda? O estoque será devolvido.')) return;
    const resposta = await fetch(`/api/vendas/${id}`, { method: 'DELETE' });
    if (!resposta.ok) {
      alert('Não foi possível excluir. Tente novamente.');
      return;
    }
    carregar();
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 pb-24">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Painel Profissional</p>
        <h1 className="font-display text-2xl font-bold">
          Venda de <span className="text-brand-gold italic">Produto</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Para quando o barbeiro vende um produto avulso, sem corte junto.
        </p>
      </div>

      <div className="card grid grid-cols-2 md:grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Data</label>
          <input type="date" className="input" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Quem vendeu</label>
          <select className="input" value={barbeiroId} onChange={(e) => setBarbeiroId(e.target.value)}>
            <option value="">Selecione</option>
            {barbeiros.filter((b) => b.ativo).map((b) => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Pagamento</label>
          <select className="input" value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
            <option>Dinheiro</option>
            <option>Pix</option>
            <option>Débito</option>
            <option>Crédito</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {produtos.filter((p) => p.ativo).map((p) => (
          <button
            key={p.id}
            onClick={() => adicionarAoCarrinho(p)}
            className="card text-left hover:border-brand-gold transition active:scale-95"
          >
            <div className="aspect-square rounded-lg bg-neutral-800 mb-2 flex items-center justify-center overflow-hidden">
              {p.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-display text-brand-gold">{p.nome.charAt(0)}</span>
              )}
            </div>
            <p className="text-sm font-medium leading-tight">{p.nome}</p>
            <p className="text-xs text-brand-gold">{fmt(Number(p.preco))}</p>
          </button>
        ))}
      </div>

      {carrinho.length > 0 && (
        <div className="card sticky bottom-3 border-brand-gold">
          <h2 className="font-display font-semibold mb-2">Carrinho</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {carrinho.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{item.nome}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => alterarQuantidade(i, -1)} className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700">−</button>
                  <span className="w-5 text-center">{item.quantidade}</span>
                  <button onClick={() => alterarQuantidade(i, 1)} className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700">+</button>
                  <span className="w-16 text-right">{fmt(item.quantidade * item.valor_unitario)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-neutral-800 mt-3 pt-3">
            <p className="font-bold">
              Total: <span className="text-brand-gold">{fmt(totalCarrinho)}</span>
            </p>
            <button className="btn" onClick={finalizarVenda} disabled={salvando}>
              Finalizar venda
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-lg">Todas as vendas (pra excluir se precisar)</h2>
          {ultimaAtualizacao && (
            <p className="text-xs text-neutral-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              Atualiza sozinho · {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
        <table className="tbl w-full text-sm">
          <thead>
            <tr className="text-neutral-400">
              <th>Data</th>
              <th>Tipo</th>
              <th>Vendido por</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Pagamento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((v) => (
              <tr key={v.id}>
                <td>{new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td className="text-xs">
                  <span className={v.tipo_venda === 'produto' ? 'text-neutral-400' : 'text-brand-gold'}>
                    {v.tipo_venda === 'produto' ? 'Produto' : 'Atendimento'}
                  </span>
                </td>
                <td>{v.barbeiro_nome}</td>
                <td className="text-xs text-neutral-400">
                  {v.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}
                </td>
                <td>{fmt(Number(v.total_geral))}</td>
                <td>{v.forma_pagamento}</td>
                <td className="text-right">
                  <button onClick={() => excluirVenda(v.id)} className="text-red-400 text-xs hover:underline">
                    excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
