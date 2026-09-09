'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Barbeiro = { id: number; nome: string; ativo: boolean };
type Venda = {
  id: number;
  data: string;
  forma_pagamento: string;
  tipo_venda: string;
  itens: { tipo: string; nome: string; quantidade: number; valor_total: string }[];
  total_geral: number;
  comissao_barbeiro: number;
};
type UsoAssinatura = {
  id: number;
  data: string;
  barbeiro_id: number;
  assinante_nome: string;
  valor_comissao: string;
};
type Vale = { id: number; data: string; valor: string; forma_pagamento: string; quitado: boolean };

export default function DetalheBarbeiroPage() {
  const params = useParams();
  const id = params?.id as string;

  const [barbeiro, setBarbeiro] = useState<Barbeiro | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [usosAssinatura, setUsosAssinatura] = useState<UsoAssinatura[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function carregar() {
      const [b, v, assin, vl] = await Promise.all([
        fetch(`/api/barbeiros/${id}`).then((r) => r.json()),
        fetch(`/api/vendas?barbeiro_id=${id}`).then((r) => r.json()),
        fetch('/api/assinaturas/resumo').then((r) => r.json()),
        fetch(`/api/vales?barbeiro_id=${id}`).then((r) => r.json()),
      ]);
      setBarbeiro(b);
      setVendas(v);
      setUsosAssinatura((assin.usos || []).filter((u: UsoAssinatura) => u.barbeiro_id === Number(id)));
      setVales(vl);
      setCarregando(false);
    }
    carregar();
  }, [id]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (carregando) return <p className="text-neutral-400">Carregando...</p>;
  if (!barbeiro) return <p className="text-neutral-400">Barbeiro não encontrado.</p>;

  const totalComissao =
    vendas.reduce((acc, v) => acc + Number(v.comissao_barbeiro), 0) +
    usosAssinatura.reduce((acc, u) => acc + Number(u.valor_comissao), 0);
  const totalVale = vales.filter((v) => !v.quitado).reduce((acc, v) => acc + Number(v.valor), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/barbeiros" className="text-xs text-neutral-500 hover:text-brand-gold">
          ← Voltar para Barbeiros
        </Link>
        <h1 className="font-display text-2xl font-bold mt-1">
          {barbeiro.nome} <span className="text-brand-gold italic">— histórico</span>
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <p className="text-xs text-neutral-400">Comissão total (tudo)</p>
          <p className="text-lg font-bold text-brand-gold">{fmt(totalComissao)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-neutral-400">Vale em aberto</p>
          <p className="text-lg font-bold text-red-400">{fmt(totalVale)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-neutral-400">Líquido</p>
          <p className="text-lg font-bold">{fmt(totalComissao - totalVale)}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="font-display font-semibold mb-3 text-lg">Vendas (atendimentos e produtos)</h2>
        {vendas.length === 0 ? (
          <p className="text-neutral-400 text-sm">Nenhuma venda registrada ainda.</p>
        ) : (
          <table className="tbl w-full text-sm">
            <thead>
              <tr className="text-neutral-400">
                <th>Data</th>
                <th>Tipo</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Comissão</th>
                <th>Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.id}>
                  <td>{new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td className="text-xs text-neutral-400">
                    {v.tipo_venda === 'produto' ? 'Produto' : 'Atendimento'}
                  </td>
                  <td className="text-xs text-neutral-400">
                    {v.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}
                  </td>
                  <td>{fmt(Number(v.total_geral))}</td>
                  <td className="text-brand-gold">{fmt(Number(v.comissao_barbeiro))}</td>
                  <td>{v.forma_pagamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {usosAssinatura.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="font-display font-semibold mb-3 text-lg">Cortes de plano mensal</h2>
          <table className="tbl w-full text-sm">
            <thead>
              <tr className="text-neutral-400">
                <th>Data</th>
                <th>Assinante</th>
                <th>Comissão</th>
              </tr>
            </thead>
            <tbody>
              {usosAssinatura.map((u) => (
                <tr key={u.id}>
                  <td>{new Date(u.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td>{u.assinante_nome}</td>
                  <td className="text-brand-gold">{fmt(Number(u.valor_comissao))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vales.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="font-display font-semibold mb-3 text-lg">Vale</h2>
          <table className="tbl w-full text-sm">
            <thead>
              <tr className="text-neutral-400">
                <th>Data</th>
                <th>Valor</th>
                <th>Pago em</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vales.map((v) => (
                <tr key={v.id}>
                  <td>{new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td className={v.quitado ? 'text-neutral-500' : 'text-red-400'}>{fmt(Number(v.valor))}</td>
                  <td className="text-neutral-400">{v.forma_pagamento}</td>
                  <td>{v.quitado ? 'Quitado' : 'Em aberto'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
