// src/app/[locale]/layout.tsx
import '../globals.css';
import type { ReactNode } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { Locale } from '@/i18n';
import AuthProvider from '@/components/AuthProvider';
import { getTSync } from '@/lib/getT';

type Props = {
  children: ReactNode;
  params: { locale: Locale };
};

export default function LocaleLayout({ children, params: { locale } }: Props) {
  const t = getTSync(locale); // переводы из базового словаря

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
        <AuthProvider>
          {/* HEADER */}
          <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href={`/${locale}`} className="font-semibold tracking-tight">
                Mindra
              </Link>
              <nav className="flex items-center gap-3 text-sm">
                <Link href={`/${locale}`} className="opacity-90 hover:opacity-100">
                  {t('nav.home')}
                </Link>
                <Link href={`/${locale}/pricing`} className="opacity-90 hover:opacity-100">
                  {t('nav.pricing')}
                </Link>
                <Link href={`/${locale}/chat`} className="opacity-90 hover:opacity-100">
                  {t('nav.chat')}
                </Link>
                <Link href={`/${locale}/support`} className="opacity-90 hover:opacity-100">
                  {t('nav.donate')}
                </Link>
                <LanguageSwitcher />
              </nav>
            </div>
          </header>

          {/* MAIN */}
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

          {/* FOOTER (маленькие ссылки, как на скрине) */}
          <footer className="mt-12 border-t border-white/10">
            <div className="mx-auto max-w-6xl px-4 py-6">
              <div className="flex flex-col gap-3 text-sm">
                <div className="opacity-70">© {new Date().getFullYear()} Mindra Group LLC</div>

                <nav aria-label={t('footer.legalNavAria')} className="flex flex-wrap gap-x-6 gap-y-2 opacity-90">
                  <Link href={`/${locale}/privacy`} className="hover:opacity-100 underline underline-offset-4">
                    {t('footer.privacy')}
                  </Link>
                  <Link href={`/${locale}/terms`} className="hover:opacity-100 underline underline-offset-4">
                    {t('footer.terms')}
                  </Link>
                  <Link href={`/${locale}/refunds`} className="hover:opacity-100 underline underline-offset-4">
                    {t('footer.refunds')}
                  </Link>
                  <Link href={`/${locale}/support`} className="hover:opacity-100 underline underline-offset-4">
                    {t('footer.support')}
                  </Link>
                  <Link href={`/${locale}/billing/portal`} className="hover:opacity-100 underline underline-offset-4">
                    {t('footer.portal')}
                  </Link>
                </nav>

                <p className="text-sm opacity-70">{t('footer.disclaimer')}</p>
                <p className="text-sm">
                  {t('footer.contact')}: <a className="underline underline-offset-4" href="mailto:support@mindra.group">support@mindra.group</a>
                </p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
