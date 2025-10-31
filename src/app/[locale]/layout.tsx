// src/app/[locale]/layout.tsx
import type {Locale} from '@/i18n';

export default function LocaleLayout({
  children,
  params: {locale},
}: {
  children: React.ReactNode;
  params: {locale: Locale};
}) {
  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
