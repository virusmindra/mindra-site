import '../globals.css';
import {ReactNode} from 'react';
import {getMessages} from 'next-intl/server';
import dynamic from 'next/dynamic';

type Props = { children: ReactNode; params: { locale: string } };

const IntlProvider = dynamic(() => import('@/components/IntlProvider'), { ssr: false });
// Пока не возвращаем Header/Banner/Footer, включим позже по одному.

export default async function RootLayout({ children, params: { locale } }: Props) {
  const raw = await getMessages({ locale });
  // 🔧 делаем сериализуемую копию — только плоский JSON пройдёт через границу RSC → client
  const messages = JSON.parse(JSON.stringify(raw));

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
