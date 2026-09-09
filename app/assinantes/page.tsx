'use client';

import { useEffect, useState } from 'react';

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

type Barbeiro = { id: number; nome: string; ativo: boolean };
type Uso = { id: number; data: string; valor_comissao: string; barbeiro_nome: string };
type Assinante = {
  id: number;
  nome: string;
  telefone: string | null;
  valor_plano: string;
  cortes_incluidos: number;
  ativo: boolean;
  ciclo_atual: {
    pagamento_id: number;
    data_pagamento: string;
    valor_pago: string;
    cortes_incluidos: number;
    cortes_usados: number;
    cortes_restantes: number;
    historico: Uso[];
  } | null;
};

export default function AssinantesPage() {
  const [assinantes, setAssinantes] = useState<Assinante[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [form, setForm] = useState({ nome: '', telefone: '', valor_plano: '', cortes_incluidos: '4' });
  const [salvando, setSalvando] = useState(false);
  const [barbeiroEscolhido, setBarbeiroEscolhido] = useState<Record<number, string>>({});

  async function carregar() {
    const [a, b] = await Promise.all([
      fetch('/api/assinantes').then((r) => r.json()),
      fetch('/api/barbeiros').then((r) => r.json()),
    ]);
    setAssinantes(a);
    setBarbeiros(b);
  }

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 15000);
    return () => clearInterval(intervalo);
  }, []);

  async function adicionar() {
    if (!form.nome.trim() || !form.valor_plano || !form.cortes_incluidos) {
      alert('Preencha nome, valor do plano e número de cortes.');
      return;
    }
    setSalvando(true);
    await fetch('/api/assinantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        telefone: form.telefone,
        valor_plano: Number(form.valor_plano),
        cortes_incluidos: Number(form.cortes_incluidos),
      }),
    });
    setForm({ nome: '', telefone: '', valor_plano: '', cortes_incluidos: '4' });
    setSalvando(false);
    carregar();
  }

  async function registrarPagamento(assinanteId: number) {
    if (!confirm('Registrar o pagamento do plano deste mês? Isso abre um novo ciclo de cortes.')) return;
    await fetch(`/api/assinantes/${assinanteId}/pagamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: hoje() }),
    });
    carregar();
  }

  async function registrarCorte(assinanteId: number) {
    const barbeiroId = barbeiroEscolhido[assinanteId];
    if (!barbeiroId) {
      alert('Escolha o barbeiro que fez o corte.');
      return;
    }
    const resposta = await fetch(`/api/assinantes/${assinanteId}/usos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barbeiro_id: barbeiroId, data: hoje() }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      alert(dados.error || 'Não foi possível registrar o corte.');
      return;
    }
    carregar();
  }

  async function excluirUso(usoId: number) {
    if (!confirm('Desfazer este corte? O crédito volta para o assinante.')) return;
    await fetch(`/api/assinatura-usos/${usoId}`, { method: 'DELETE' });
    carregar();
  }

  async function alternarAtivo(a: Assinante) {
    await fetch(`/api/assinantes/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !a.ativo }),
    });
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este assinante e todo o histórico dele?')) return;
    const resposta = await fetch(`/api/assinantes/${id}`, { method: 'DELETE' });
    if (!resposta.ok) {
      const dados = await resposta.json().catch(() => ({}));
      alert(dados.error || 'Não foi possível excluir. Tente novamente.');
      return;
    }
    carregar();
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Painel Profissional</p>
        <h1 className="font-display text-2xl font-bold">
          Plano <span className="text-brand-gold italic">Mensal</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Ex: R$ 100 = 4 cortes no mês. Cada corte usado paga ao barbeiro sua metade de R$ 25 (R$ 12,50).
        </p>
      </div>

      <div className="card grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Nome do cliente</label>
          <input
            className="input"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Telefone (opcional)</label>
          <input
            className="input"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Valor do plano (R$)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.valor_plano}
            onChange={(e) => setForm({ ...form, valor_plano: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Cortes incluídos/mês</label>
          <input
            type="number"
            className="input"
            value={form.cortes_incluidos}
            onChange={(e) => setForm({ ...form, cortes_incluidos: e.target.value })}
          />
        </div>
        <div className="col-span-2 md:col-span-4">
          <button className="btn" onClick={adicionar} disabled={salvando}>
            Cadastrar assinante
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {assinantes.map((a) => {
          const valorPorCorte = Number(a.valor_plano) / a.cortes_incluidos;
          return (
            <div key={a.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-semibold">
                    {a.nome} {a.telefone && <span className="text-xs text-neutral-500">· {a.telefone}</span>}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Plano {fmt(Number(a.valor_plano))} · {a.cortes_incluidos} cortes/mês ·{' '}
                    <span className="text-brand-gold">{fmt(valorPorCorte)}/corte</span>
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => alternarAtivo(a)}
                    className={`text-xs px-2 py-1 rounded ${
                      a.ativo ? 'bg-green-900 text-green-300' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {a.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button onClick={() => excluir(a.id)} className="text-red-400 text-xs hover:underline">
                    excluir
                  </button>
                </div>
              </div>

              {a.ciclo_atual ? (
                <div className="mt-3 border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm">
                      Ciclo desde{' '}
                      {new Date(a.ciclo_atual.data_pagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} —{' '}
                      <span
                        className={`font-semibold ${
                          a.ciclo_atual.cortes_restantes > 0 ? 'text-brand-gold' : 'text-red-400'
                        }`}
                      >
                        {a.ciclo_atual.cortes_restantes} de {a.ciclo_atual.cortes_incluidos} cortes restantes
                      </span>
                    </p>
                    <button
                      className="text-xs px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                      onClick={() => registrarPagamento(a.id)}
                    >
                      Registrar novo pagamento (renovar)
                    </button>
                  </div>

                  {a.ciclo_atual.cortes_restantes > 0 && (
                    <div className="flex gap-2 mt-3">
                      <select
                        className="input"
                        value={barbeiroEscolhido[a.id] || ''}
                        onChange={(e) => setBarbeiroEscolhido({ ...barbeiroEscolhido, [a.id]: e.target.value })}
                      >
                        <option value="">Qual barbeiro cortou?</option>
                        {barbeiros.filter((b) => b.ativo).map((b) => (
                          <option key={b.id} value={b.id}>{b.nome}</option>
                        ))}
                      </select>
                      <button className="btn whitespace-nowrap" onClick={() => registrarCorte(a.id)}>
                        Registrar corte de hoje
                      </button>
                    </div>
                  )}

                  {a.ciclo_atual.historico.length > 0 && (
                    <table className="tbl w-full text-xs mt-3">
                      <thead>
                        <tr className="text-neutral-500">
                          <th>Data</th>
                          <th>Barbeiro</th>
                          <th>Comissão</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.ciclo_atual.historico.map((u) => (
                          <tr key={u.id}>
                            <td>{new Date(u.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                            <td>{u.barbeiro_nome}</td>
                            <td className="text-brand-gold">{fmt(Number(u.valor_comissao))}</td>
                            <td className="text-right">
                              <button onClick={() => excluirUso(u.id)} className="text-red-400 hover:underline">
                                desfazer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="mt-3 border-t border-neutral-800 pt-3">
                  <p className="text-sm text-neutral-500 mb-2">Nenhum pagamento registrado ainda.</p>
                  <button className="btn" onClick={() => registrarPagamento(a.id)}>
                    Registrar primeiro pagamento
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="font-display font-semibold mb-3 text-lg">
          Controle <span className="text-brand-gold">financeiro</span> dos planos
        </h2>
        {assinantes.filter((a) => a.ativo).length === 0 ? (
          <p className="text-neutral-400 text-sm">Nenhum assinante ativo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl w-full text-sm">
              <thead>
                <tr className="text-neutral-400">
                  <th>Assinante</th>
                  <th>Plano mensal</th>
                  <th>Último pagamento</th>
                  <th>Valor pago</th>
                  <th>Cortes restantes</th>
                </tr>
              </thead>
              <tbody>
                {assinantes.filter((a) => a.ativo).map((a) => (
                  <tr key={a.id}>
                    <td>{a.nome}</td>
                    <td>{fmt(Number(a.valor_plano))}</td>
                    <td>
                      {a.ciclo_atual
                        ? new Date(a.ciclo_atual.data_pagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                        : '-'}
                    </td>
                    <td className="text-brand-gold">
                      {a.ciclo_atual ? fmt(Number(a.ciclo_atual.valor_pago)) : '-'}
                    </td>
                    <td>
                      {a.ciclo_atual ? `${a.ciclo_atual.cortes_restantes}/${a.ciclo_atual.cortes_incluidos}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-neutral-400 border-t border-neutral-800">
                  <td className="font-semibold text-neutral-200">Total ativo em planos</td>
                  <td colSpan={3} className="font-semibold text-brand-gold">
                    {fmt(
                      assinantes
                        .filter((a) => a.ativo && a.ciclo_atual)
                        .reduce((acc, a) => acc + Number(a.ciclo_atual!.valor_pago), 0)
                    )}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
