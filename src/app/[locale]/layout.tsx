import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations} from "next-intl/server";
import Link from "next/link";
import "@/app/globals.css";
import {DONATE_URL} from "@/lib/links";
import LanguageSwitcher from "@/components/LanguageSwitcher";



export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const {locale} = params;

  // 1) Берём все сообщения, которые собрал src/i18n.ts (base + header + pricing + donate + thanks)
  const messages = await getMessages({locale});
  // 2) Берём t для шапки (можно без namespace)
  const t = await getTranslations({locale});

  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <header className="border-b border-white/10">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
            <Link href={`/${locale}`} className="font-semibold">Mindra</Link>
            <div className="flex items-center justify-center gap-3">
              <Link className="text-sm opacity-90 hover:opacity-100" href={`/${locale}/pricing`}>
                {t("nav.pricing")}
              </Link>
              <a
                className="rounded-xl border border-white/20 px-3 py-1.5 text-sm hover:bg-white hover:text-zinc-900 transition"
                href={DONATE_URL}
                target="_blank"
                rel="noopener"
              >
                {t("nav.donate")}
              </a>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* ВАЖНО: сюда кладём ВСЕ messages */}
        <NextIntlClientProvider messages={messages} locale={locale}>
          <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        </NextIntlClientProvider>

        <footer className="border-t border-white/10">
          <div className="mx-auto max-w-5xl px-4 py-8 opacity-70 text-sm">© 2025 Mindra</div>
        </footer>
      </body>
    </html>
  );
}
