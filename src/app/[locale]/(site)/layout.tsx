// src/app/[locale]/(site)/layout.tsx
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

export default function SiteLayout(
  { children, params }: { children: ReactNode; params: { locale: Locale } }
) {
  const { locale } = params;

  return (
    <div className="min-h-dvh flex flex-col">
      <SiteHeader locale={locale} />

      {/* сайт ДОЛЖЕН скроллиться */}
      <main className="flex-1 px-6 py-10">
        {children}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
