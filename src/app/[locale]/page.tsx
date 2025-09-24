import {useTranslations} from "next-intl";
import Link from "next/link";
import {TELEGRAM_URL, PRICING_URL} from "@/lib/links";

export default function HomePage() {
  const t = useTranslations();

  return (
    <section className="py-10">
      <p className="uppercase tracking-widest text-zinc-400 text-sm mb-6">Mindra — тёплый AI-друг и коуч</p>

      <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
        {t("hero.title")}
      </h1>

      <p className="mt-4 text-zinc-300 max-w-2xl">{t("hero.subtitle")}</p>

      <div className="mt-8 flex gap-3">
        <a
          className="btn btn-primary inline-block rounded-xl px-4 py-2 bg-white text-zinc-900"
          href={TELEGRAM_URL}
          target="_blank"
        >
          {t("cta.launch")}
        </a>
        <Link
          className="btn btn-ghost inline-block rounded-xl px-4 py-2 border border-white/20"
          href={PRICING_URL}
        >
          {t("cta.pricing")}
        </Link>
      </div>

      <h2 className="mt-12 text-2xl font-semibold">{t("features.title")}</h2>
    </section>
  );
}
