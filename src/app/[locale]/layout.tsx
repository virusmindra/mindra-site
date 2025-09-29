// app/[locale]/layout.tsx
import "@/app/globals.css";
import Link from "next/link";
import {DONATE_URL} from "@/lib/links";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SafeIntlProvider from "@/components/SafeIntlProvider";

// ВАЖНО: берем наш кастомный мерджер, а не next-intl/server
import {getMessages} from "@/i18n";
// Делаем t на сервере из тех же messages
import {createTranslator} from "next-intl";

export default async function RootLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // Загружаем полный мердж с фолбэками (твой src/i18n.ts)
  const messages = await getMessages({locale});

  // t должен смотреть в ТОТ ЖЕ объект messages
  const t = createTranslator({locale, messages});

  // Если провайдеру нужно "плоское" — оставь сериализацию,
  // но это не обязательно, если объект сериализуемый.
  const flat = JSON.parse(JSON.stringify(messages));

  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <SafeIntlProvider locale={locale} messages={flat}>
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

          <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>

          <footer className="border-t border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-8 opacity-70 text-sm">© 2025 Mindra</div>
          </footer>
        </SafeIntlProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'];
  return locales.map((locale) => ({locale}));
}
