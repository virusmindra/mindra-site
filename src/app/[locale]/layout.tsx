// src/app/[locale]/layout.tsx
import "../globals.css";
import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

export const dynamic = "force-dynamic";

type LayoutProps = {
  children: ReactNode;
  params: { locale: string };
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: LayoutProps) {
  // Загружаем объединённые сообщения для текущей локали (см. src/i18n.ts)
  const messages = await getMessages();

  return (
    <html lang={locale} className="bg-zinc-950 text-zinc-100">
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/* Cookie banner на всех страницах */}
          <CookieBanner />

          {/* Шапка с навигацией и переключателем языка */}
          <AppHeader />

          {/* Контент */}
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-8">{children}</div>
          </main>

          {/* Подвал */}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// Генерация статических параметров для всех поддерживаемых локалей
export function generateStaticParams() {
  const locales = ["ru", "en", "uk", "pl", "es", "fr", "de", "kk", "hy", "ka", "md"] as const;
  return locales.map((locale) => ({ locale }));
}
