import LegalPage from "@/components/LegalPage";
import type { Locale } from "@/i18n";

export const metadata = { title: "Privacy Policy — Mindra" };

export default function Page({ params: { locale } }: { params: { locale: Locale } }) {
  return <LegalPage ns="privacy" locale={locale} />;
}
