import "@/app/globals.css";
import {NextIntlClientProvider} from "next-intl";
import type {Metadata} from "next";
import getRequestConfig from "@/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Mindra",
  description: "Support, motivation & habit tracker — in one bot"
};

export default async function RootLayout({
  children, params
}: { children: React.ReactNode; params: {locale: string} }) {
  const {messages} = await getRequestConfig({locale: params.locale});

  return (
    <html lang={params.locale}>
      <body className="container mx-auto px-5">
        <NextIntlClientProvider messages={messages}>
          <Header locale={params.locale} />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
