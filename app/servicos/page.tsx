'use client';

import { useEffect, useState } from 'react';

type Servico = { id: number; nome: string; preco: string; imagem_url: string | null; ativo: boolean };

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [form, setForm] = useState({ nome: '', preco: '', imagem_url: '' });
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  async function enviarFoto(arquivo: File) {
    setEnviandoFoto(true);
    const formData = new FormData();
    formData.append('file', arquivo);
    const resposta = await fetch('/api/upload', { method: 'POST', body: formData });
    const dados = await resposta.json();
    setEnviandoFoto(false);
    if (dados.url) {
      setForm((f) => ({ ...f, imagem_url: dados.url }));
    } else {
      alert('Não foi possível enviar a foto. Tente novamente.');
    }
  }

  async function carregar() {
    const s = await fetch('/api/servicos').then((r) => r.json());
    setServicos(s);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function adicionar() {
    if (!form.nome.trim() || !form.preco) {
      alert('Preencha nome e preço.');
      return;
    }
    setSalvando(true);
    await fetch('/api/servicos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: form.nome, preco: Number(form.preco), imagem_url: form.imagem_url }),
    });
    setForm({ nome: '', preco: '', imagem_url: '' });
    setSalvando(false);
    carregar();
  }

  async function alternarAtivo(s: Servico) {
    await fetch(`/api/servicos/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !s.ativo }),
    });
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este serviço?')) return;
    await fetch(`/api/servicos/${id}`, { method: 'DELETE' });
    carregar();
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Painel Profissional</p>
        <h1 className="font-display text-2xl font-bold">
          Catálogo de <span className="text-brand-gold italic">Serviços</span>
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Ex: Corte normal, Corte e sobrancelha, Corte na máquina, Plano mensal...
        </p>
      </div>

      <div className="card grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Serviço</label>
          <input
            className="input"
            placeholder="Ex: Corte e sobrancelha"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Preço (R$)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.preco}
            onChange={(e) => setForm({ ...form, preco: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Foto (opcional)</label>
          <input
            type="file"
            accept="image/*"
            className="input text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-brand-gold file:text-black file:text-xs"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) enviarFoto(arquivo);
            }}
          />
          {enviandoFoto && <p className="text-xs text-neutral-500 mt-1">Enviando foto...</p>}
          {form.imagem_url && !enviandoFoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.imagem_url} alt="prévia" className="w-10 h-10 rounded object-cover mt-1" />
          )}
        </div>
        <div>
          <button className="btn w-full" onClick={adicionar} disabled={salvando}>
            Cadastrar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {servicos.map((s) => (
          <div key={s.id} className="card">
            <div className="aspect-square rounded-lg bg-neutral-800 mb-2 flex items-center justify-center overflow-hidden">
              {s.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.imagem_url} alt={s.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-display text-brand-gold">{s.nome.charAt(0)}</span>
              )}
            </div>
            <p className="font-medium text-sm">{s.nome}</p>
            <p className="text-brand-gold text-sm">{fmt(Number(s.preco))}</p>
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => alternarAtivo(s)}
                className={`text-xs px-2 py-1 rounded ${
                  s.ativo ? 'bg-green-900 text-green-300' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {s.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <button onClick={() => excluir(s.id)} className="text-red-400 text-xs hover:underline">
                excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
