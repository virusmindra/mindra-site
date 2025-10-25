import '../globals.css';
import { ReactNode } from 'react';
import { getMessages } from 'next-intl/server'; 
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import Providers from '../providers';

export const dynamic = 'force-dynamic';

type Props = { children: ReactNode; params: { locale: string } };

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  const messages = await getMessages();

  return (
    <html lang={locale} className="bg-zinc-950 text-zinc-100">
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <CookieBanner />
          <SiteHeader />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-10">{children}</div>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
  return locales.map((locale) => ({ locale }));
}
