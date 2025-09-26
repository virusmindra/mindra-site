import React from "react";
import {NextIntlClientProvider} from "next-intl";
import Link from "next/link";
import "@/app/globals.css";
import {DONATE_URL} from "@/lib/links";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const dynamic = "force-static";

export const metadata = {
  title: "Mindra",
  description: "MINDRA — тёплый AI-друг и коуч",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // Грузим JSON строго из папки сообщений
  const messages = (await import(`@/app/[locale]/messages/${params.locale}.json`)).default as Record<string, any>;

  return (
    <html lang={params.locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <header className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-b border-white/10">
          <Link href={`/${params.locale}`} className="font-semibold">Mindra</Link>
          <div className="flex items-center justify-center gap-3">
            <Link className="text-sm opacity-90 hover:opacity-100" href={`/${params.locale}/pricing`}>
              {messages["nav.pricing"] ?? "Pricing"}
            </Link>
            <a
              className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white hover:text-zinc-900 transition"
              href={DONATE_URL}
              target="_blank"
              rel="noopener"
            >
              {messages["nav.donate"] ?? "Donate"}
            </a>
            <LanguageSwitcher/>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          <NextIntlClientProvider locale={params.locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </main>

        <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-white/10">
          <p className="text-sm opacity-70">© 2025 Mindra</p>
        </footer>
      </body>
    </html>
  );
}
