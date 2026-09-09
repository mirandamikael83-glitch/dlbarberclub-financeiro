'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Barbeiro = { id: number; nome: string; ativo: boolean };

export default function BarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const r = await fetch('/api/barbeiros').then((r) => r.json());
    setBarbeiros(r);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function adicionar() {
    if (!nome.trim()) return;
    setSalvando(true);
    await fetch('/api/barbeiros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    setNome('');
    setSalvando(false);
    carregar();
  }

  async function alternarAtivo(b: Barbeiro) {
    await fetch(`/api/barbeiros/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !b.ativo }),
    });
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este barbeiro? Isso não apaga o histórico de entradas já lançadas.')) return;
    await fetch(`/api/barbeiros/${id}`, { method: 'DELETE' });
    carregar();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Painel Profissional</p>
        <h1 className="font-display text-2xl font-bold">
          Nossos <span className="text-brand-gold italic">Barbeiros</span>
        </h1>
      </div>

      <div className="card flex gap-2">
        <input
          className="input"
          placeholder="Nome do barbeiro"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
        />
        <button className="btn whitespace-nowrap" onClick={adicionar} disabled={salvando}>
          Adicionar
        </button>
      </div>

      <div className="card">
        <table className="tbl w-full text-sm">
          <thead>
            <tr className="text-neutral-400">
              <th>Nome</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {barbeiros.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link href={`/barbeiros/${b.id}`} className="text-brand-gold hover:underline">
                    {b.nome}
                  </Link>
                </td>
                <td>
                  <button
                    onClick={() => alternarAtivo(b)}
                    className={`text-xs px-2 py-1 rounded ${
                      b.ativo ? 'bg-green-900 text-green-300' : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {b.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="text-right">
                  <button onClick={() => excluir(b.id)} className="text-red-400 text-xs hover:underline">
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
