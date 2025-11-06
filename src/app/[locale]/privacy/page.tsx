// src/app/[locale]/privacy/page.tsx
import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Privacy Policy — Mindra" };
export default function Page({ params: { locale } }: { params: { locale: any } }) {
  return <LegalPage ns="privacy" locale={locale} />;
}