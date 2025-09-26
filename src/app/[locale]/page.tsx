"use client";

import Link from "next/link";
import {useTranslations} from "next-intl";
import {TELEGRAM_URL} from "@/lib/links";

export default function HomePage() {
  const t = useTranslations();

  return (
    <section className="py-10">
      <p className="uppercase tracking-widest text-zinc-400 text-sm mb-6">
        {t("brand.tagline")}
      </p>

      <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
        {t("hero.title")}
      </h1>
      <p className="text-zinc-300 mt-4 max-w-2xl">{t("hero.subtitle")}</p>

      <div className="mt-6 flex gap-3">
        <a
          className="rounded-xl bg-white text-zinc-900 px-4 py-2"
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener"
        >
          {t("cta.launch")}
        </a>
        <Link
          className="rounded-xl border border-white/20 px-4 py-2"
          href="./pricing"
        >
          {t("cta.pricing")}
        </Link>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">{t("features.title")}</h2>
    </section>
  );
}
