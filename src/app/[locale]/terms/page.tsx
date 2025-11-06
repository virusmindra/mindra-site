// src/app/[locale]/terms/page.tsx
import LegalPage from "@/components/LegalPage";
export const metadata = { title: "Terms of Service — Mindra" };
export default function Page({ params: { locale } }: { params: { locale: any } }) {
  return <LegalPage ns="terms" locale={locale} />;
}