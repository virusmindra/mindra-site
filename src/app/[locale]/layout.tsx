import type { ReactNode } from 'react';
import type { Locale } from '@/i18n';
import AuthProvider from '@/components/AuthProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import SetHtmlLang from '@/components/SetHtmlLang';

type Props = { children: ReactNode; params: { locale: Locale } };

export default function LocaleLayout({ children, params: { locale } }: Props) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SetHtmlLang locale={locale} />
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
