// src/app/[locale]/layout.tsx
'use client';

import { useTheme } from '@/components/theme/useTheme';

import '../globals.css';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import AuthProvider from '@/components/AuthProvider';

type Props = { children: ReactNode; params: { locale: Locale } };

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body className="min-h-dvh antialiased bg-[var(--bg)] text-[var(--fg)]">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}