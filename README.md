# DL Barber Club — Financeiro / PDV

Sistema para controlar **vendas** (cortes + produtos), **saídas** (despesas) e
calcular automaticamente a **comissão de 50%** dos barbeiros — só sobre
serviços, produto fica 100% pra barbearia. Tem controle de estoque e um
dashboard de fechamento por período (pensado pro fechamento do sábado).

## O que ele faz
- Cadastro de barbeiros
- **Catálogo de serviços** (Corte normal, Corte e sobrancelha, Corte na máquina, Plano mensal, etc.), cada um com preço e imagem opcional
- Cadastro de produtos com preço, estoque e imagem opcional (coca, cerveja, pomada, etc.)
- **Venda (PDV) em grade visual**: toque no serviço e nos produtos vendidos (com fotos, como um cardápio) — a quantidade se ajusta no carrinho antes de finalizar, com baixa automática de estoque
- Lançamento de saídas (aluguel, produtos, contas, etc.)
- Dashboard "Fechamento da Semana": faturamento total, quantos cortes,
  quanto de cada produto foi vendido, comissão por barbeiro, saídas e
  saldo líquido — já vem com a semana atual selecionada
- Sem login — feito para uso só pelo admin (você)

## Como colocar no ar (Vercel)

### 1. Suba o código para o GitHub
Crie um repositório novo e suba esta pasta inteira (`dl-barber-financeiro`).

### 2. Importe na Vercel
Em vercel.com → **Add New → Project** → selecione o repositório.

### 3. Crie o banco de dados (Postgres)
Dentro do projeto na Vercel, vá na aba **Storage → Create Database →
Postgres** e conecte ao projeto. A Vercel cria sozinha as variáveis de
ambiente (`POSTGRES_URL` etc.) — você não precisa copiar nada manualmente.

### 4. Deploy
Clique em **Deploy**. As tabelas do banco são criadas automaticamente na
primeira vez que o site é acessado.

### 5. Crie o armazenamento de fotos (Vercel Blob)
Para poder enviar fotos direto da pasta do computador/celular, ainda dentro
da aba **Storage**, clique em **Create Database** de novo → escolha
**Blob** → **Create** → conecte ao projeto (igual você fez com o Postgres).
Depois disso, faça um novo **Redeploy** (aba Deployments → "..." → Redeploy).

### 6. Primeiro uso
1. Cadastre os barbeiros em **Barbeiros**
2. Cadastre os serviços (corte normal, corte e sobrancelha, plano mensal...) em **Serviços** — dá pra enviar uma foto direto do computador/celular
3. Cadastre os produtos (com preço, estoque e foto) em **Produtos**
4. No sábado (ou todo dia), toque nos serviços e produtos vendidos em **Vendas**
5. Acompanhe o fechamento na **Dashboard**

### Sobre as fotos
Agora é só clicar em "Foto (opcional)" no cadastro de produto/serviço e
escolher a imagem direto da galeria do celular ou de uma pasta do
computador — sem precisar de link. A foto some pouco a pouco enquanto
sobe ("Enviando foto...") e depois mostra uma prévia pequena.

## Rodar localmente (opcional)
```bash
npm install
vercel env pull .env.local   # puxa as variáveis do banco já criado na Vercel
npm run dev
```
Acesse http://localhost:3000

## Observações
- A comissão está fixada em 50% do valor dos **serviços** (não incide sobre
  produtos). Constante `PERCENTUAL_COMISSAO_BARBEIRO` em `lib/db.ts`.
- Estoque é ajustado automaticamente: vende produto → desconta; exclui a
  venda → devolve o estoque.
- Os dados ficam guardados no banco Postgres da Vercel — não se perdem ao
  atualizar a página nem entre dispositivos diferentes.
