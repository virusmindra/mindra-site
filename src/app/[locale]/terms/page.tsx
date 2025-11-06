import LegalPage from "@/components/LegalPage";
import type { Locale } from "@/i18n";

export const metadata = { title: "Terms of Service — Mindra" };

export default function Page({ params: { locale } }: { params: { locale: Locale } }) {
  return <LegalPage ns="terms" locale={locale} />;
}
