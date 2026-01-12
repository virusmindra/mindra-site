// src/app/[locale]/page.tsx
import Link from "next/link";
import { getTSync } from "@/lib/getT";
import type { Locale } from "@/i18n";

type Props = { params: { locale: Locale } };

export default function Page({ params: { locale } }: Props) {
  const t = getTSync(locale);

  const featureItems = [
    { title: t("features.cards.chat.title"), text: t("features.cards.chat.text") },
    { title: t("features.cards.voice.title"), text: t("features.cards.voice.text") },
    { title: t("features.cards.face.title"), text: t("features.cards.face.text") },
    { title: t("features.cards.goals.title"), text: t("features.cards.goals.text") },
    { title: t("features.cards.habits.title"), text: t("features.cards.habits.text") },
    { title: t("features.cards.reminders.title"), text: t("features.cards.reminders.text") },
  ];

  const steps = [
    { k: "01", title: t("how.steps.1.title"), text: t("how.steps.1.text") },
    { k: "02", title: t("how.steps.2.title"), text: t("how.steps.2.text") },
    { k: "03", title: t("how.steps.3.title"), text: t("how.steps.3.text") },
  ];

  return (
    <section className="pt-16 md:pt-24 pb-14 md:pb-20 mx-auto max-w-6xl px-4">
      {/* HERO */}
      <header className="text-center space-y-6">
        <p className="text-sm uppercase tracking-wider text-[var(--muted)]">
          {t("brand.tagline")}
        </p>

        <h1 className="text-3xl md:text-5xl font-semibold text-[var(--text)]">
          {t("home.hero.title")}
        </h1>

        <p className="max-w-3xl mx-auto text-[var(--muted)] text-base md:text-lg leading-relaxed">
          {t("home.hero.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href={`/${locale}/chat`}
            className="rounded-xl bg-white text-zinc-900 px-5 py-2.5 text-sm font-medium hover:opacity-90"
          >
            {t("home.cta.startChat")}
          </Link>

          <Link
            href={`/${locale}/pricing`}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm text-[var(--text)]
                       hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            {t("home.cta.viewPlans")}
          </Link>
        </div>

        {/* small trust row */}
        <div className="pt-2 text-xs text-[var(--muted)]">
          {t("home.hero.note")}
        </div>
      </header>

      {/* WHAT IS */}
      <section className="mt-14 md:mt-18 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-10">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text)]">
              {t("home.what.title")}
            </h2>
            <p className="text-[var(--muted)] leading-relaxed">
              {t("home.what.text")}
            </p>
          </div>

          <div className="grid gap-3">
            {steps.map((s) => (
              <div
                key={s.k}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="text-xs font-semibold rounded-full border border-[var(--border)] px-2 py-1 text-[var(--muted)]">
                    {s.k}
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text)]">{s.title}</div>
                    <div className="text-sm text-[var(--muted)] mt-1">{s.text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mt-14 md:mt-18 space-y-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-[var(--text)]">
          {t("home.features.title")}
        </h2>

        <p className="max-w-3xl mx-auto text-center text-[var(--muted)]">
          {t("home.features.subtitle")}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureItems.map((f, i) => (
            <article
              key={i}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5
                         hover:border-black/20 dark:hover:border-white/20 transition-colors"
            >
              <h3 className="font-semibold text-[var(--text)]">{f.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-14 md:mt-18 text-center rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 md:p-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text)]">
          {t("home.final.title")}
        </h2>
        <p className="mt-2 text-[var(--muted)] max-w-2xl mx-auto">
          {t("home.final.subtitle")}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href={`/${locale}/chat`}
            className="rounded-xl bg-[var(--accent)] text-white px-5 py-2.5 text-sm font-medium hover:opacity-90"
          >
            {t("home.final.ctaStart")}
          </Link>

          <Link
            href={`/${locale}/pricing`}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm text-[var(--text)]
                       hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            {t("home.final.ctaPlans")}
          </Link>
        </div>

        <div className="mt-4 text-xs text-[var(--muted)]">
          {t("home.final.note")}
        </div>
      </section>
    </section>
  );
}
