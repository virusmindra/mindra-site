import '../globals.css';
import {ReactNode} from 'react';
import {getMessages} from 'next-intl/server';
import dynamic from 'next/dynamic';

type Props = { children: ReactNode; params: { locale: string } };

// клиентские куски — только через dynamic + ssr:false
const IntlProvider = dynamic(() => import('@/components/IntlProvider'), { ssr: false });
const AppHeader    = dynamic(() => import('@/components/AppHeader'),   { ssr: false });
const CookieBanner = dynamic(() => import('@/components/CookieBanner'),{ ssr: false });
const Footer       = dynamic(() => import('@/components/Footer'),      { ssr: false });

export default async function RootLayout({ children, params: { locale } }: Props) {
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <IntlProvider locale={locale} messages={messages}>
          <CookieBanner />
          <AppHeader />
          <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
          <Footer />
        </IntlProvider>
      </body>
    </html>
  );
}
