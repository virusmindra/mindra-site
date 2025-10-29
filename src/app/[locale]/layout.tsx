// src/app/[locale]/layout.tsx
import '../globals.css';
import {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import {locales} from '@/i18n';

type Props = { children: ReactNode; params: {locale: string} };

export default async function LocaleLayout({children, params:{locale}}: Props) {
  const messages = await getMessages(); // Берёт то, что отдаёт getRequestConfig
  return (
    <html lang={locale} className="bg-zinc-950 text-zinc-100">
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <CookieBanner/>
          <AppHeader/>
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
          </main>
          <Footer/>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return (locales as readonly string[]).map((l) => ({locale: l}));
}
