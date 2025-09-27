import { getTranslations } from "next-intl/server";
import { DONATE_URL } from "@/lib/links";

export default async function DonatePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  return (
    <section className="py-10">
      <h1 className="text-4xl font-semibold">{t("donate.title")}</h1>
      <p className="mt-3 opacity-80">{t("donate.subtitle")}</p>

      <a
        className="inline-block mt-6 rounded-xl px-4 py-2 bg-white text-zinc-900"
        href={DONATE_URL}
        target="_blank"
        rel="noopener"
      >
        {t("donate.cta")}
      </a>
    </section>
  );
}
