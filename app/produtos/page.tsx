'use client';

import { useEffect, useState } from 'react';

type Produto = {
  id: number;
  nome: string;
  preco: string;
  estoque: number;
  ativo: boolean;
  imagem_url: string | null;
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form, setForm] = useState({ nome: '', preco: '', estoque: '', imagem_url: '' });
  const [ajustes, setAjustes] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

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
    const p = await fetch('/api/produtos').then((r) => r.json());
    setProdutos(p);
    setUltimaAtualizacao(new Date());
  }

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 15000);
    return () => clearInterval(intervalo);
  }, []);

  async function adicionar() {
    if (!form.nome.trim() || !form.preco) {
      alert('Preencha nome e preço.');
      return;
    }
    setSalvando(true);
    await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        preco: Number(form.preco),
        estoque: Number(form.estoque || 0),
        imagem_url: form.imagem_url,
      }),
    });
    setForm({ nome: '', preco: '', estoque: '', imagem_url: '' });
    setSalvando(false);
    carregar();
  }

  async function aplicarAjuste(id: number) {
    const valor = Number(ajustes[id]);
    if (!valor) return;
    await fetch(`/api/produtos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ajusteEstoque: valor }),
    });
    setAjustes({ ...ajustes, [id]: '' });
    carregar();
  }

  async function alternarAtivo(p: Produto) {
    await fetch(`/api/produtos/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !p.ativo }),
    });
    carregar();
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este produto?')) return;
    await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
    carregar();
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Painel Profissional</p>
        <h1 className="font-display text-2xl font-bold">
          Produtos <span className="text-brand-gold italic">& Estoque</span>
        </h1>
        {ultimaAtualizacao && (
          <p className="text-xs text-neutral-600 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            Atualiza sozinho · {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
          </p>
        )}
      </div>

      <div className="card grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Produto</label>
          <input
            className="input"
            placeholder="Ex: Coca-Cola lata"
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
          <label className="block text-xs text-neutral-400 mb-1">Estoque inicial</label>
          <input
            type="number"
            className="input"
            value={form.estoque}
            onChange={(e) => setForm({ ...form, estoque: e.target.value })}
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
        {produtos.map((p) => (
          <div key={p.id} className="card">
            <div className="aspect-square rounded-lg bg-neutral-800 mb-2 flex items-center justify-center overflow-hidden">
              {p.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-display text-brand-gold">{p.nome.charAt(0)}</span>
              )}
            </div>
            <p className="font-medium text-sm">{p.nome}</p>
            <p className="text-brand-gold text-sm">{fmt(Number(p.preco))}</p>
            <p className={`text-xs mt-1 ${p.estoque <= 3 ? 'text-red-400 font-semibold' : 'text-neutral-400'}`}>
              Estoque: {p.estoque}
            </p>
            <div className="flex gap-1 mt-2">
              <input
                type="number"
                placeholder="+12 ou -1"
                className="input text-xs py-1"
                value={ajustes[p.id] || ''}
                onChange={(e) => setAjustes({ ...ajustes, [p.id]: e.target.value })}
              />
              <button
                className="text-xs px-2 rounded bg-neutral-800 hover:bg-neutral-700"
                onClick={() => aplicarAjuste(p.id)}
              >
                OK
              </button>
            </div>
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => alternarAtivo(p)}
                className={`text-xs px-2 py-1 rounded ${
                  p.ativo ? 'bg-green-900 text-green-300' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {p.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <button onClick={() => excluir(p.id)} className="text-red-400 text-xs hover:underline">
                excluir
              </button>
            </div>
          </div>
        ))}
      </div>
      {produtos.some((p) => p.estoque <= 3) && (
        <p className="text-xs text-red-400">⚠ Produtos com estoque em vermelho estão com 3 unidades ou menos.</p>
      )}
    </div>
  );
}
