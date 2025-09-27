import {getTranslations} from "next-intl/server";
import {TELEGRAM_URL} from "@/lib/links";

export default async function PricingPage({params}: {params: {locale: string}}) {
  const {locale} = params;
  const t = await getTranslations({locale});

  // features.items хранится в *.pricing.json.
  // Подтянем его напрямую и аккуратно приведём к string[].
  const featuresRaw = await import(
    `@/app/[locale]/messages/${locale}.pricing.json`
  )
    .then(m => (m.default as any)?.["features.items"])
    .catch(() => undefined) as unknown;

  const features =
    Array.isArray(featuresRaw)
      ? (featuresRaw as string[])
      : featuresRaw && typeof featuresRaw === "object"
        ? Object.values(featuresRaw as Record<string, string>)
        : [];

  return (
    <section className="py-10">
      <h1 className="text-4xl font-semibold">{t("pricing.title")}</h1>
      <p className="mt-3 text-zinc-300">{t("pricing.subtitle")}</p>

      <div className="grid md:grid-cols-3 gap-4 mt-8">
        {/* Free */}
        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-semibold">{t("plan.free.name")}</h3>
          <p className="opacity-80 mt-2">{t("plan.free.desc")}</p>
          <a
            className="inline-block mt-6 rounded-xl px-4 py-2 border border-white/20"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("cta.telegram")}
          </a>
        </div>

        {/* Plus */}
        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-semibold">{t("plan.plus.name")}</h3>
          <p className="opacity-90 mt-1">{t("plan.plus.from")}</p>
          <p className="opacity-80 mt-2">{t("plan.plus.desc")}</p>
          <a
            className="inline-block mt-6 rounded-xl px-4 py-2 bg-white text-zinc-900"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("cta.telegram")}
          </a>
        </div>

        {/* Pro */}
        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-semibold">{t("plan.pro.name")}</h3>
          <p className="opacity-90 mt-1">{t("plan.pro.from")}</p>
          <p className="opacity-80 mt-2">{t("plan.pro.desc")}</p>
          <a
            className="inline-block mt-6 rounded-xl px-4 py-2 border border-white/20"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("cta.telegram")}
          </a>
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">{t("features.header")}</h2>
      <ul className="mt-3 space-y-1 opacity-90 list-disc pl-6">
        {features.map((f, i) => (<li key={i}>{f}</li>))}
      </ul>
    </section>
  );
}
