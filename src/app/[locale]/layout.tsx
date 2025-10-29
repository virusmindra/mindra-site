// src/app/[locale]/layout.tsx
import '../globals.css';
import {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import dynamic from 'next/dynamic';

type Props = { children: ReactNode; params: { locale: string } };

const AppHeader    = dynamic(() => import('@/components/AppHeader'),   { ssr: false });
const CookieBanner = dynamic(() => import('@/components/CookieBanner'), { ssr: false });
const Footer       = dynamic(() => import('@/components/Footer'),       { ssr: false });

export default async function RootLayout({children, params:{locale}}: Props) {
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <CookieBanner />
          <AppHeader />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-8">
              {children}
            </div>
          </main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
