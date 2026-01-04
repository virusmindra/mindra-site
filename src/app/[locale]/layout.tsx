// src/app/[locale]/layout.tsx
'use client';

import { useTheme } from '@/components/theme/useTheme';

import '../globals.css';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n';
import AuthProvider from '@/components/AuthProvider';

type Props = { children: ReactNode; params: { locale: Locale } };

export default function LocaleLayout({ children, params: { locale } }: Props) {
  const { theme } = useTheme(); // 👈 ТОЛЬКО ЧИТАЕМ

  return (
    <html lang={locale}>
      <body
        className={[
          'min-h-dvh antialiased',
          theme === 'light'
            ? 'bg-white text-zinc-900'
            : 'bg-zinc-950 text-zinc-100',
        ].join(' ')}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
