// app/[locale]/layout.tsx
import "@/app/globals.css";
import Link from "next/link";
import {DONATE_URL} from "@/lib/links";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {getMessages as loadMessages} from "@/i18n";
import {createTranslator} from "next-intl";
import SafeIntlProvider from "@/components/SafeIntlProvider";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

type LayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function RootLayout({children, params}: LayoutProps) {
  const lng = params.locale;
  const messages = await loadMessages({ locale: lng });
  const t = await createTranslator({ locale: lng, messages });

  return (
    <html lang={lng}>
      <body className="min-h-screen flex flex-col text-zinc-100 bg-zinc-950">
        <SafeIntlProvider locale={lng} messages={messages}>
          {/* Cookie banner на всех страницах */}
          <CookieBanner />

          {/* Header */}
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

          {/* Main */}
          <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-10">
            {children}
          </main>

          {/* Footer */}
          <Footer />
        </SafeIntlProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
  return locales.map((locale) => ({ locale }));
}
