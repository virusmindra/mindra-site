// app/[locale]/layout.tsx
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
  // Получаем переводы на сервере и прокидываем в провайдер
  const messages = await getMessages();

  return (
    <html lang={locale} className="bg-zinc-950 text-zinc-100">
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/* Cookie banner на всех страницах */}
          <CookieBanner />

          {/* Header (внутри AppHeader можно отрендерить LanguageSwitcher, ссылки pricing/donate и т.д.) */}
          <AppHeader />

          {/* Main */}
          <main className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-8">
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  const locales = [
    "ru",
    "en",
    "uk",
    "pl",
    "es",
    "fr",
    "de",
    "kk",
    "hy",
    "ka",
    "md",
  ] as const;

  return locales.map((locale) => ({ locale }));
}
