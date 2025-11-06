// src/app/[locale]/refunds/page.tsx
import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Refund Policy — Mindra" };
export default function Page({ params: { locale } }: { params: { locale: any } }) {
  return <LegalPage ns="refunds" locale={locale} />;
}