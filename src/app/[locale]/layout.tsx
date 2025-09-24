import './globals.css';
import {NextIntlClientProvider} from 'next-intl';
import type {Metadata} from 'next';
import getRequestConfig from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
  const {messages} = await getRequestConfig({locale: params.locale} as any);

  return (
    <html lang={params.locale}>
      <body className="min-h-dvh bg-zinc-900 text-zinc-100 antialiased">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 bg-zinc-900/80 border-b border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="font-semibold tracking-wide">Mindra</div>
            <LanguageSwitcher />
          </div>
        </header>

        <NextIntlClientProvider locale={params.locale} messages={messages}>
          {children}
        </NextIntlClientProvider>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-400 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Mindra</span>
            <LanguageSwitcher />
          </div>
        </footer>
      </body>
    </html>
  );
}
