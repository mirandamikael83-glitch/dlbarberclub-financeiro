'use client';

import { useEffect, useState } from 'react';

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

type Saida = {
  id: number;
  data: string;
  descricao: string;
  categoria: string;
  valor: string;
  forma_pagamento: string;
};

const CATEGORIAS = ['Aluguel', 'Produtos', 'Contas (água/luz/internet)', 'Manutenção', 'Marketing', 'Outros'];
const FORMAS_PAGAMENTO = ['Dinheiro', 'Pix', 'Débito', 'Crédito', 'Transferência'];

export default function SaidasPage() {
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [form, setForm] = useState({
    data: hoje(),
    descricao: '',
    categoria: 'Outros',
    valor: '',
    forma_pagamento: 'Dinheiro',
  });
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const s = await fetch('/api/saidas').then((r) => r.json());
    setSaidas(s);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    if (!form.descricao || !form.valor) {
      alert('Preencha a descrição e o valor.');
      return;
    }
    setSalvando(true);
    await fetch('/api/saidas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ ...form, descricao: '', valor: '' });
    setSalvando(false);
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm('Excluir esta saída?')) return;
    await fetch(`/api/saidas/${id}`, { method: 'DELETE' });
    carregar();
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Painel Profissional</p>
        <h1 className="font-display text-2xl font-bold">
          Controle de <span className="text-brand-gold italic">Despesas</span>
        </h1>
      </div>

      <div className="card grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Data</label>
          <input
            type="date"
            className="input"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Descrição</label>
          <input
            className="input"
            placeholder="Ex: compra de shampoo"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Categoria</label>
          <select
            className="input"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          >
            {CATEGORIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Pago em</label>
          <select
            className="input"
            value={form.forma_pagamento}
            onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}
          >
            {FORMAS_PAGAMENTO.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
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
        <div className="col-span-2 md:col-span-5">
          <button className="btn" onClick={salvar} disabled={salvando}>
            Lançar saída
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="tbl w-full text-sm">
          <thead>
            <tr className="text-neutral-400">
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Pago em</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {saidas.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td>{s.descricao}</td>
                <td>{s.categoria}</td>
                <td className="text-neutral-400">{s.forma_pagamento}</td>
                <td className="text-red-400">{fmt(Number(s.valor))}</td>
                <td className="text-right">
                  <button onClick={() => excluir(s.id)} className="text-red-400 text-xs hover:underline">
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
