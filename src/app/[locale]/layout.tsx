import '../globals.css';
import {ReactNode} from 'react';
import {getMessages} from 'next-intl/server';
import dynamic from 'next/dynamic';

type Props = { children: ReactNode; params: { locale: string } };
const IntlProvider = dynamic(() => import('@/components/IntlProvider'), { ssr: false });

export default async function RootLayout({ children, params: { locale } }: Props) {
  // всё равно берём messages, но передадим пустой объект
  await getMessages({ locale }).catch(() => null);
  const messages = {};

  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <IntlProvider locale={locale} messages={messages}>
          {children}
        </IntlProvider>
      </body>
    </html>
  );
}
