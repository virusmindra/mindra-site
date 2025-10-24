// src/app/[locale]/layout.tsx
import '../globals.css';
import { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale} className="bg-zinc-950 text-zinc-100">
      <body className="min-h-screen flex flex-col antialiased">
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
  return locales.map((locale) => ({ locale }));
}
