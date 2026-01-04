// src/app/[locale]/(site)/layout.tsx
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

export default function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: Locale };
}) {
  const { locale } = params;

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg)] text-[var(--text)]">
      {/* HEADER — full width */}
      <SiteHeader locale={locale} />

      {/* CONTENT — centered */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          {children}
        </div>
      </main>

      {/* FOOTER — full width */}
      <Footer locale={locale} />
    </div>
  );
}
