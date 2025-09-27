import { getTranslations } from "next-intl/server";

export default async function ThanksPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  return (
    <section className="py-10">
      <h1 className="text-4xl font-semibold">{t("thanks.title")}</h1>
      <p className="mt-3 opacity-80">{t("thanks.subtitle")}</p>
    </section>
  );
}
