import "@/app/globals.css";
import type {Metadata} from "next";
import {NextIntlClientProvider} from "next-intl";
import getRequestConfig from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Mindra",
  description: "Support, motivation and habits in one bot"
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params?.locale ?? "ru";
  // грузим сообщения через наш i18n helper
  const {messages} = await getRequestConfig({locale});

  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-zinc-950 text-zinc-100">
        <header className="container mx-auto flex items-center justify-between py-4 border-b border-white/10">
          <div className="font-semibold">Mindra</div>
          <LanguageSwitcher />
        </header>

        <NextIntlClientProvider messages={messages}>
          <main className="container mx-auto py-8">{children}</main>
        </NextIntlClientProvider>

        <footer className="container mx-auto py-6 border-t border-white/10 text-sm opacity-70">
          © {new Date().getFullYear()} Mindra
        </footer>
      </body>
    </html>
  );
}
