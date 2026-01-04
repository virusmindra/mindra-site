// src/app/[locale]/layout.tsx
import '../globals.css';
import type { ReactNode } from 'react';
import type { Locale } from '@/i18n';
import AuthProvider from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

type Props = { children: ReactNode; params: { locale: Locale } };

export default function LocaleLayout({ children, params: { locale } }: Props) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-dvh antialiased bg-[var(--bg)] text-[var(--text)]">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
