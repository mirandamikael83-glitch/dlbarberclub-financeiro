'use client';

import { useEffect, useMemo, useState } from 'react';

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

type Barbeiro = { id: number; nome: string; ativo: boolean };
type Vale = {
  id: number;
  barbeiro_id: number;
  barbeiro_nome: string;
  data: string;
  valor: string;
  forma_pagamento: string;
  quitado: boolean;
};

export default function ValesPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  const [form, setForm] = useState({ barbeiro_id: '', data: hoje(), valor: '', forma_pagamento: 'Dinheiro' });
  const [salvando, setSalvando] = useState(false);
  const [mostrarQuitados, setMostrarQuitados] = useState(false);

  async function carregar() {
    const [b, v] = await Promise.all([
      fetch('/api/barbeiros').then((r) => r.json()),
      fetch('/api/vales').then((r) => r.json()),
    ]);
    setBarbeiros(b);
    setVales(v);
  }

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 15000);
    return () => clearInterval(intervalo);
  }, []);

  async function adicionar() {
    if (!form.barbeiro_id || !form.valor) {
      alert('Escolha o barbeiro e o valor do vale.');
      return;
    }
    setSalvando(true);
    await fetch('/api/vales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barbeiro_id: form.barbeiro_id,
        data: form.data,
        valor: Number(form.valor),
        forma_pagamento: form.forma_pagamento,
      }),
    });
    setForm({ barbeiro_id: '', data: hoje(), valor: '', forma_pagamento: 'Dinheiro' });
    setSalvando(false);
    carregar();
  }

  async function alternarQuitado(v: Vale) {
    await fetch(`/api/vales/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quitado: !v.quitado }),
    });
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este vale?')) return;
    await fetch(`/api/vales/${id}`, { method: 'DELETE' });
    carregar();
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const porBarbeiro = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const v of vales) {
      if (v.quitado) continue;
      mapa[v.barbeiro_nome] = (mapa[v.barbeiro_nome] || 0) + Number(v.valor);
    }
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }, [vales]);

  const valesVisiveis = vales.filter((v) => mostrarQuitados || !v.quitado);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Painel Profissional</p>
        <h1 className="font-display text-2xl font-bold">
          Controle de <span className="text-brand-gold italic">Vale</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Adiantamentos dados aos barbeiros — descontar depois da comissão deles.
        </p>
      </div>

      {porBarbeiro.length > 0 && (
        <div className="card">
          <h2 className="font-display font-semibold mb-2 text-lg">Vale em aberto por barbeiro</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {porBarbeiro.map(([nome, total]) => (
              <div key={nome} className="bg-neutral-800 rounded-lg p-3">
                <p className="text-xs text-neutral-400">{nome}</p>
                <p className="text-lg font-bold text-red-400">{fmt(total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Barbeiro</label>
          <select
            className="input"
            value={form.barbeiro_id}
            onChange={(e) => setForm({ ...form, barbeiro_id: e.target.value })}
          >
            <option value="">Selecione</option>
            {barbeiros.filter((b) => b.ativo).map((b) => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Data</label>
          <input type="date" className="input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Pago em</label>
          <select
            className="input"
            value={form.forma_pagamento}
            onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}
          >
            <option>Dinheiro</option>
            <option>Pix</option>
            <option>Débito</option>
            <option>Crédito</option>
            <option>Transferência</option>
          </select>
        </div>
        <div className="col-span-2 md:col-span-4">
          <button className="btn" onClick={adicionar} disabled={salvando}>
            Registrar vale
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-lg">Histórico</h2>
          <label className="text-xs text-neutral-400 flex items-center gap-1">
            <input
              type="checkbox"
              checked={mostrarQuitados}
              onChange={(e) => setMostrarQuitados(e.target.checked)}
            />
            Mostrar quitados
          </label>
        </div>
        <table className="tbl w-full text-sm">
          <thead>
            <tr className="text-neutral-400">
              <th>Data</th>
              <th>Barbeiro</th>
              <th>Valor</th>
              <th>Pago em</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {valesVisiveis.map((v) => (
              <tr key={v.id}>
                <td>{new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td>{v.barbeiro_nome}</td>
                <td className={v.quitado ? 'text-neutral-500' : 'text-red-400'}>{fmt(Number(v.valor))}</td>
                <td className="text-neutral-400">{v.forma_pagamento}</td>
                <td>
                  <button
                    onClick={() => alternarQuitado(v)}
                    className={`text-xs px-2 py-1 rounded ${
                      v.quitado ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                    }`}
                  >
                    {v.quitado ? 'Quitado' : 'Em aberto'}
                  </button>
                </td>
                <td className="text-right">
                  <button onClick={() => excluir(v.id)} className="text-red-400 text-xs hover:underline">
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
