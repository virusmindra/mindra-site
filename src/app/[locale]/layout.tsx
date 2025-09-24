import './globals.css';
import {NextIntlClientProvider} from 'next-intl';
import type {Metadata} from 'next';
import getRequestConfig from '@/i18n';

export const metadata: Metadata = {
  title: 'Mindra',
  description: 'Support, motivation & habit tracker — in one bot.'
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // Загружаем сообщения для текущего locale
  const {messages} = await getRequestConfig({locale: params.locale} as any);

  return (
    <html lang={params.locale}>
      <body className="min-h-dvh bg-zinc-900 text-zinc-100 antialiased">
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
