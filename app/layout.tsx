import './globals.css';
import Link from 'next/link';
import { Playfair_Display, Inter } from 'next/font/google';

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700'],
});
const body = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'DL Barber Club — Painel Financeiro',
  description: 'Controle de entradas, saídas e comissões',
  themeColor: '#C9A96E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={display.variable}>
      <body className={`min-h-screen bg-neutral-950 text-neutral-100 ${body.className}`}>
        <nav className="border-b border-neutral-800 bg-black">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <Link href="/" className="font-display font-bold text-brand-gold text-lg tracking-wide">
              DL BARBER CLUB <span className="text-neutral-400 font-normal text-sm">· Financeiro</span>
            </Link>
            <div className="flex gap-4 text-sm flex-wrap">
              <Link href="/" className="hover:text-brand-gold">Dashboard</Link>
              <Link href="/vendas" className="hover:text-brand-gold">Vendas</Link>
              <Link href="/vendas-produtos" className="hover:text-brand-gold">Venda de Produto</Link>
              <Link href="/assinantes" className="hover:text-brand-gold">Assinantes</Link>
              <Link href="/servicos" className="hover:text-brand-gold">Serviços</Link>
              <Link href="/produtos" className="hover:text-brand-gold">Produtos</Link>
              <Link href="/saidas" className="hover:text-brand-gold">Saídas</Link>
              <Link href="/vales" className="hover:text-brand-gold">Vale</Link>
              <Link href="/barbeiros" className="hover:text-brand-gold">Barbeiros</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
