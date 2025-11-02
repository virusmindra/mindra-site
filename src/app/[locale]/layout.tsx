// src/app/[locale]/layout.tsx
import '../globals.css';
import type {ReactNode} from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type {Locale} from '@/i18n';

type Props = {
  children: ReactNode;
  params: { locale: Locale };
};

export default function LocaleLayout({ children, params: { locale } }: Props) {
  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href={`/${locale}`} className="font-semibold tracking-tight">
              Mindra
            </Link>

            <nav className="flex items-center gap-3 text-sm">
              <Link href={`/${locale}`} className="opacity-90 hover:opacity-100">Home</Link>
              <Link href={`/${locale}/pricing`} className="opacity-90 hover:opacity-100">Pricing</Link>
              <Link href={`/${locale}/chat`} className="opacity-90 hover:opacity-100">Chat</Link>
              <Link href={`/${locale}/support`} className="opacity-90 hover:opacity-100">Donate</Link>
              {/* Если твой свитчер ожидает проп current, используй:
                   <LanguageSwitcher current={locale} /> */}
              <LanguageSwitcher />
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="mt-12 border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm opacity-70">
            © {new Date().getFullYear()} Mindra Group LLC
          </div>
        </footer>
      </body>
    </html>
  );
}
