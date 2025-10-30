import '../globals.css';
import {ReactNode} from 'react';
import {NextIntlClientProvider} from 'next-intl';
import {getMessagesSync} from '@/i18n';

type Props = { children: ReactNode; params: { locale: string } };

export default function RootLayout({children, params: {locale}}: Props) {
  const messages = getMessagesSync(locale); // наши JSON, синхронно

  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
