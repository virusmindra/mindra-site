import SafeIntlProvider from '@/components/SafeIntlProvider';
import {getMessages, getTranslations} from 'next-intl/server'; // оставим, см. ниже
// ...

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const {locale} = params;
  const messages = await getMessages({locale});
  const flat = JSON.parse(JSON.stringify(messages)); // OK

  // t из сервера в шапке можно оставить, но лучше через getT (см. п.3)
  const t = await getTranslations({locale});

  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <header className="border-b border-white/10">
          {/* ... */}
          <a /* ... */>{t('nav.donate')}</a>
          {/* ... */}
        </header>

        {/* ВАЖНО: тут теперь клиентский враппер */}
        <SafeIntlProvider messages={flat} locale={locale}>
          <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        </SafeIntlProvider>

        <footer className="border-t border-white/10">{/* ... */}</footer>
      </body>
    </html>
  );
}
