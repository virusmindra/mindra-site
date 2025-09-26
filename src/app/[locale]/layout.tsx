import React from "react";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations} from "next-intl/server";
import Link from "next/link";
import "@/app/globals.css";
import {DONATE_URL, TELEGRAM_URL, PRICING_URL} from "@/lib/links";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const messages = await getMessages({locale: params.locale});
  const t = await getTranslations({locale: params.locale});

  return (
    <html lang={params.locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <header className="container mx-auto px-5 py-4 flex items-center justify-between border-b border-white/10">
          <Link href={`/${params.locale}`} className="font-medium">
            Mindra
          </Link>

          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/${params.locale}/pricing`}
              className="text-sm opacity-90 hover:opacity-100"
            >
              {t("nav.pricing")}
            </Link>
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener"
              className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white hover:text-zinc-900 transition"
            >
              {t("nav.donate")}
            </a>

            <LanguageSwitcher />
          </div>
        </header>

        <NextIntlClientProvider messages={messages} locale={params.locale}>
          <main className="container mx-auto px-5">{children}</main>
        </NextIntlClientProvider>

        <footer className="container mx-auto px-5 py-10 opacity-70">
          <p className="text-sm">{t("brand.tagline")}</p>
          <p className="text-xs mt-2">© 2025 Mindra</p>
        </footer>
      </body>
    </html>
  );
}
