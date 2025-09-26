import "@/app/globals.css";
import {NextIntlClientProvider} from "next-intl";
import type {Metadata} from "next";
import getRequestConfig from "@/i18n";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {PRICING_URL} from "@/lib/links";

export const metadata: Metadata = {
  title: "Mindra",
};

export default async function RootLayout({children, params}: {children: React.ReactNode; params: {locale: string}}) {
  const config = await getRequestConfig({locale: params.locale});
  return (
    <html lang={params.locale}>
      <body className="min-h-dvh text-zinc-100 bg-zinc-950">
        <NextIntlClientProvider messages={config.messages}>
          <header className="border-b border-white/10">
            <div className="container py-4 flex items-center justify-between gap-3">
              <Link href={`/${params.locale}`} className="font-semibold">Mindra</Link>
              <nav className="flex items-center gap-4">
                <Link href={`/${params.locale}${PRICING_URL}`} className="opacity-90 hover:opacity-100 transition">Pricing</Link>
                <Link href={`/${params.locale}/donate`} className="opacity-90 hover:opacity-100 transition">Donate</Link>
                <LanguageSwitcher />
              </nav>
            </div>
          </header>
          <main className="container py-8">{children}</main>
          <footer className="container py-10 opacity-70 text-sm border-t border-white/10">
            © 2025 Mindra
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
