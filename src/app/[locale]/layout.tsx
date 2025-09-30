// app/[locale]/layout.tsx
import "@/app/globals.css";
import Link from "next/link";
import {DONATE_URL} from "@/lib/links";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {getMessages as loadMessages} from "@/i18n";
import {createTranslator} from "next-intl";
import SafeIntlProvider from "@/components/SafeIntlProvider";

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function RootLayout({children, params}: LayoutProps) {
  const lng = params.locale; // <-- обычная строка
  const messages = await loadMessages({ locale: lng }); // <-- string ок
  const t = await createTranslator({ locale: lng, messages });

  return (
    <html lang={lng}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <SafeIntlProvider locale={lng} messages={messages}>
          <header className="border-b border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
              <Link href={`/${lng}`} className="font-semibold">Mindra</Link>
              <div className="flex items-center justify-center gap-3">
                <Link className="text-sm opacity-90 hover:opacity-100" href={`/${lng}/pricing`}>
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
  const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
  return locales.map((locale) => ({ locale }));
}
