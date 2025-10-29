// src/app/[locale]/layout.tsx
import '../globals.css';
import {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import CookieBanner from '@/components/CookieBanner';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

type Props = {children: ReactNode; params: {locale: string}};

export default async function LocaleLayout({children, params:{locale}}: Props) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <CookieBanner/>
      <AppHeader/>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
      </main>
      <Footer/>
    </NextIntlClientProvider>
  );
}
