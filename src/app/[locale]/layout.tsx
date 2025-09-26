import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations, unstable_setRequestLocale} from "next-intl/server";
import Link from "next/link";
import "@/app/globals.css";
import {DONATE_URL} from "@/lib/links";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const metadata = {
  title: "Mindra",
  description: "Supportive AI-friend. Multilingual."
};

export default async function RootLayout(
  {children, params}: {children: React.ReactNode; params: {locale: string}}
) {
  const {locale} = params;
  // Устанавливаем локаль роута
  unstable_setRequestLocale(locale);

  // Сообщения и переводчик для SSR
  const messages = await getMessages();
  const t = await getTranslations();

  return (
    <html lang={locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <header className="border-b border-white/10">
            <div className="max-w-5xl mx-auto flex items-center justify-between py-4 px-4">
              <Link href={`/${locale}`} className="font-semibold tracking-wide">Mindra</Link>
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

          <main className="max-w-5xl mx-auto px-4 py-10">
            {children}
          </main>

          <footer className="border-t border-white/10 py-8 mt-8">
            <div className="max-w-5xl mx-auto px-4 text-sm opacity-70">
              © {new Date().getFullYear()} Mindra
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
