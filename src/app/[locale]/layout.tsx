// src/app/[locale]/layout.tsx
import '../globals.css';
import type {ReactNode} from 'react';
import type {Locale} from '@/i18n';

export default function LocaleLayout({
  children,
  params: { locale }
}: { children: ReactNode; params: { locale: Locale } }) {
  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">{children}</body>
    </html>
  );
}
