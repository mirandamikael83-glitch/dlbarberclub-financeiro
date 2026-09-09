'use client';

import { useEffect, useMemo, useState } from 'react';

function segundaFeiraDestaSemana() {
  const d = new Date();
  const dia = d.getDay(); // 0 = domingo
  const diff = dia === 0 ? -6 : 1 - dia;
  const seg = new Date(d);
  seg.setDate(d.getDate() + diff);
  return seg.toISOString().slice(0, 10);
}
function hoje() {
  return new Date().toISOString().slice(0, 10);
}

type ItemVenda = { tipo: 'servico' | 'produto'; nome: string; quantidade: number; valor_total: string };
type Venda = {
  id: number;
  data: string;
  barbeiro_nome: string;
  itens: ItemVenda[];
  total_servicos: number;
  total_produtos: number;
  total_geral: number;
  comissao_barbeiro: number;
};
type Saida = { id: number; data: string; descricao: string; categoria: string; valor: string };
type PagamentoAssinatura = { id: number; assinante_nome: string; valor: string };
type UsoAssinatura = { id: number; barbeiro_nome: string; assinante_nome: string; valor_comissao: string; data: string };
type Vale = { id: number; barbeiro_nome: string; valor: string };

export default function Dashboard() {
  const [inicio, setInicio] = useState(segundaFeiraDestaSemana());
  const [fim, setFim] = useState(hoje());
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [pagamentosAssinatura, setPagamentosAssinatura] = useState<PagamentoAssinatura[]>([]);
  const [usosAssinatura, setUsosAssinatura] = useState<UsoAssinatura[]>([]);
  const [vales, setVales] = useState<Vale[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  async function carregar(primeiraVez = false) {
    if (primeiraVez) setCarregando(true);
    const [v, s, assin, vl] = await Promise.all([
      fetch(`/api/vendas?inicio=${inicio}&fim=${fim}`).then((r) => r.json()),
      fetch(`/api/saidas?inicio=${inicio}&fim=${fim}`).then((r) => r.json()),
      fetch(`/api/assinaturas/resumo?inicio=${inicio}&fim=${fim}`).then((r) => r.json()),
      fetch(`/api/vales?inicio=${inicio}&fim=${fim}`).then((r) => r.json()),
    ]);
    setVendas(v);
    setSaidas(s);
    setPagamentosAssinatura(assin.pagamentos || []);
    setUsosAssinatura(assin.usos || []);
    setVales(vl);
    setCarregando(false);
    setUltimaAtualizacao(new Date());
  }

  useEffect(() => {
    carregar(true);
    const intervalo = setInterval(() => carregar(false), 15000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio, fim]);

  const totalServicos = useMemo(() => vendas.reduce((acc, v) => acc + Number(v.total_servicos), 0), [vendas]);
  const totalProdutos = useMemo(() => vendas.reduce((acc, v) => acc + Number(v.total_produtos), 0), [vendas]);
  const totalAssinaturas = useMemo(
    () => pagamentosAssinatura.reduce((acc, p) => acc + Number(p.valor), 0),
    [pagamentosAssinatura]
  );
  const totalFaturado = totalServicos + totalProdutos + totalAssinaturas;
  const comissaoVendas = useMemo(() => vendas.reduce((acc, v) => acc + Number(v.comissao_barbeiro), 0), [vendas]);
  const comissaoAssinaturas = useMemo(
    () => usosAssinatura.reduce((acc, u) => acc + Number(u.valor_comissao), 0),
    [usosAssinatura]
  );
  const totalComissoes = comissaoVendas + comissaoAssinaturas;
  const totalSaidas = useMemo(() => saidas.reduce((acc, s) => acc + Number(s.valor), 0), [saidas]);
  const parteBarbearia = totalFaturado - totalComissoes;
  const saldoLiquido = parteBarbearia - totalSaidas;
  const totalCortes = useMemo(
    () => vendas.reduce((acc, v) => acc + v.itens.filter((i) => i.tipo === 'servico').length, 0),
    [vendas]
  );
  const totalCortesPlano = usosAssinatura.length;

  const porBarbeiro = useMemo(() => {
    const mapa: Record<string, { faturado: number; comissao: number; atendimentos: number; vale: number }> = {};
    for (const v of vendas) {
      if (!mapa[v.barbeiro_nome]) mapa[v.barbeiro_nome] = { faturado: 0, comissao: 0, atendimentos: 0, vale: 0 };
      mapa[v.barbeiro_nome].faturado += Number(v.total_geral);
      mapa[v.barbeiro_nome].comissao += Number(v.comissao_barbeiro);
      // Só conta como "atendimento" quando a venda tem corte/serviço — venda de produto avulso não conta aqui
      mapa[v.barbeiro_nome].atendimentos += v.itens.filter((i) => i.tipo === 'servico').length;
    }
    for (const u of usosAssinatura) {
      if (!mapa[u.barbeiro_nome]) mapa[u.barbeiro_nome] = { faturado: 0, comissao: 0, atendimentos: 0, vale: 0 };
      mapa[u.barbeiro_nome].comissao += Number(u.valor_comissao);
      mapa[u.barbeiro_nome].atendimentos += 1;
    }
    for (const vl of vales) {
      if (!mapa[vl.barbeiro_nome]) mapa[vl.barbeiro_nome] = { faturado: 0, comissao: 0, atendimentos: 0, vale: 0 };
      mapa[vl.barbeiro_nome].vale += Number(vl.valor);
    }
    return Object.entries(mapa).sort((a, b) => b[1].comissao - a[1].comissao);
  }, [vendas, usosAssinatura, vales]);

  const porBarbeiroEDia = useMemo(() => {
    const mapa: Record<string, { faturado: number; comissao: number; atendimentos: number }> = {};
    for (const v of vendas) {
      const chave = `${v.barbeiro_nome}|${v.data}`;
      if (!mapa[chave]) mapa[chave] = { faturado: 0, comissao: 0, atendimentos: 0 };
      mapa[chave].faturado += Number(v.total_geral);
      mapa[chave].comissao += Number(v.comissao_barbeiro);
      mapa[chave].atendimentos += v.itens.filter((i) => i.tipo === 'servico').length;
    }
    for (const u of usosAssinatura) {
      const chave = `${u.barbeiro_nome}|${u.data}`;
      if (!mapa[chave]) mapa[chave] = { faturado: 0, comissao: 0, atendimentos: 0 };
      mapa[chave].comissao += Number(u.valor_comissao);
      mapa[chave].atendimentos += 1;
    }
    return Object.entries(mapa)
      .map(([chave, dados]) => {
        const [barbeiro, data] = chave.split('|');
        return { barbeiro, data, ...dados };
      })
      .sort((a, b) => a.barbeiro.localeCompare(b.barbeiro) || a.data.localeCompare(b.data));
  }, [vendas, usosAssinatura]);

  const porProduto = useMemo(() => {
    const mapa: Record<string, { barbeiro: string; quantidade: number; total: number }> = {};
    for (const v of vendas) {
      for (const i of v.itens) {
        if (i.tipo !== 'produto') continue;
        const chave = `${i.nome}|${v.barbeiro_nome}`;
        if (!mapa[chave]) mapa[chave] = { barbeiro: v.barbeiro_nome, quantidade: 0, total: 0 };
        mapa[chave].quantidade += i.quantidade;
        mapa[chave].total += Number(i.valor_total);
      }
    }
    return Object.entries(mapa)
      .map(([chave, dados]) => ({ nome: chave.split('|')[0], ...dados }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [vendas]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-neutral-500">Painel Profissional</p>
        <h1 className="font-display text-2xl font-bold">
          Fechamento <span className="text-brand-gold italic">da Semana</span>
        </h1>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">De</label>
          <input type="date" className="input" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Até</label>
          <input type="date" className="input" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
        <p className="text-xs text-neutral-500 pb-2">Já vem com a semana atual (segunda até hoje) selecionada.</p>
        {ultimaAtualizacao && (
          <p className="text-xs text-neutral-600 pb-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
            Atualiza sozinho · última vez às {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
          </p>
        )}
      </div>

      {carregando ? (
        <p className="text-neutral-400">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card">
              <p className="text-xs text-neutral-400">Faturamento total</p>
              <p className="text-xl font-bold text-brand-gold">{fmt(totalFaturado)}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {totalCortes} cortes avulsos · {totalCortesPlano} cortes de plano · {fmt(totalProdutos)} em produtos
              </p>
              {totalAssinaturas > 0 && (
                <p className="text-xs text-neutral-500">{fmt(totalAssinaturas)} em planos pagos no período</p>
              )}
            </div>
            <div className="card">
              <p className="text-xs text-neutral-400">Comissões (barbeiros)</p>
              <p className="text-xl font-bold">{fmt(totalComissoes)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-neutral-400">Saídas / despesas</p>
              <p className="text-xl font-bold text-red-400">{fmt(totalSaidas)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-neutral-400">Saldo líquido da barbearia</p>
              <p className={`text-xl font-bold ${saldoLiquido >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmt(saldoLiquido)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-display font-semibold mb-3 text-lg">
                Comissões por <span className="text-brand-gold">barbeiro</span>
              </h2>
              {porBarbeiro.length === 0 ? (
                <p className="text-neutral-400 text-sm">Nenhum atendimento no período.</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="tbl w-full text-sm">
                  <thead>
                    <tr className="text-neutral-400">
                      <th>Barbeiro</th>
                      <th>Atend.</th>
                      <th>Faturado</th>
                      <th>Comissão</th>
                      <th>Vale</th>
                      <th>Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porBarbeiro.map(([nome, dados]) => (
                      <tr key={nome}>
                        <td>{nome}</td>
                        <td>{dados.atendimentos}</td>
                        <td>{fmt(dados.faturado)}</td>
                        <td className="text-brand-gold font-medium">{fmt(dados.comissao)}</td>
                        <td className={dados.vale > 0 ? 'text-red-400' : 'text-neutral-600'}>
                          {dados.vale > 0 ? `-${fmt(dados.vale)}` : '-'}
                        </td>
                        <td className="font-semibold">{fmt(dados.comissao - dados.vale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="font-display font-semibold mb-3 text-lg">
                Produtos <span className="text-brand-gold">vendidos</span>
              </h2>
              {porProduto.length === 0 ? (
                <p className="text-neutral-400 text-sm">Nenhum produto vendido no período.</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="tbl w-full text-sm">
                  <thead>
                    <tr className="text-neutral-400">
                      <th>Produto</th>
                      <th>Barbeiro</th>
                      <th>Qtd.</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porProduto.map((p) => (
                      <tr key={`${p.nome}-${p.barbeiro}`}>
                        <td>{p.nome}</td>
                        <td className="text-neutral-400">{p.barbeiro}</td>
                        <td className="font-medium">{p.quantidade}</td>
                        <td>{fmt(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="font-display font-semibold mb-3 text-lg">
              Vendas por <span className="text-brand-gold">barbeiro e dia</span>
            </h2>
            {porBarbeiroEDia.length === 0 ? (
              <p className="text-neutral-400 text-sm">Nenhuma venda no período.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="tbl w-full text-sm">
                <thead>
                  <tr className="text-neutral-400">
                    <th>Barbeiro</th>
                    <th>Dia</th>
                    <th>Atend.</th>
                    <th>Faturado</th>
                    <th>Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {porBarbeiroEDia.map((linha) => (
                    <tr key={`${linha.barbeiro}-${linha.data}`}>
                      <td>{linha.barbeiro}</td>
                      <td>{new Date(linha.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                      <td>{linha.atendimentos}</td>
                      <td>{fmt(linha.faturado)}</td>
                      <td className="text-brand-gold">{fmt(linha.comissao)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
