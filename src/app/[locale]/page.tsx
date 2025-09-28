// src/app/[locale]/page.tsx
'use client';

import Link from "next/link";
import {useTranslations} from "next-intl";
import {useParams} from "next/navigation";
import {TELEGRAM_URL} from "@/lib/links";

export default function HomePage() {
  const t = useTranslations();
  const params = useParams() as {locale?: string};
  const locale = params?.locale ?? 'ru';

  return (
    <section className="py-10">
      <p className="uppercase tracking-widest text-zinc-400 text-sm mb-5">
        {t("brand.tagline")}
      </p>

      <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
        {t("hero.title")}
      </h1>

      <p className="mt-4 text-zinc-300 max-w-2xl">
        {t("hero.subtitle")}
      </p>

      <div className="mt-6 flex gap-3">
        <a
          className="rounded-xl px-4 py-2 bg-white text-zinc-900"
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener"
        >
          {t("cta.launch")}
        </a>

        <Link
          className="rounded-xl px-4 py-2 border border-white/20"
          href={`/${locale}/pricing`}
        >
          {t("cta.pricing")}
        </Link>
      </div>

      <h2 className="mt-10 text-2xl font-semibold">
        {t("features.title")}
      </h2>

      <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { k: "chat" },
          { k: "coach" },
          { k: "goals" },
          { k: "reports" },
          { k: "voice" },
          { k: "premium" },
        ].map(({ k }) => (
          <li key={k} className="rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-semibold">
              {t(`features.cards.${k}.title`)}
            </h3>
            <p className="opacity-80 mt-2">
              {t(`features.cards.${k}.text`)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
