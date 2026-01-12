// src/app/[locale]/pricing/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMessagesSync, type Locale } from "@/i18n";
import { getTSync } from "@/lib/getT";

type Plan = "PLUS" | "PRO";
type Term = "1M" | "3M" | "6M" | "12M";

const TERMS: { term: Term; discountLabelKey: string }[] = [
  { term: "1M", discountLabelKey: "term.discount.none" },
  { term: "3M", discountLabelKey: "term.discount.3M" },  // -10%
  { term: "6M", discountLabelKey: "term.discount.6M" },  // -15%
  { term: "12M", discountLabelKey: "term.discount.12M" }, // -25%
];

export default function PricingPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = getTSync(locale, "pricing");
  const router = useRouter();

  const messages = getMessagesSync(locale, "pricing") as Record<string, unknown>;
  const raw = (messages["features.items"] ?? []) as unknown;
  const features = useMemo(() => {
    return Array.isArray(raw)
      ? (raw as string[])
      : raw && typeof raw === "object"
        ? Object.values(raw as Record<string, string>)
        : [];
  }, [raw]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedPlan, setPickedPlan] = useState<Plan | null>(null);

  const openPicker = (plan: Plan) => {
    setPickedPlan(plan);
    setPickerOpen(true);
  };

  const startCheckout = async (plan: Plan, term: Term) => {
    // Вариант A (рекомендую): GET редиректом на /api/checkout?plan=PLUS&term=3M&locale=en
    // Если у тебя сейчас checkout только POST — скажи, и я дам вариант под POST+redirect.
    const url = `/api/checkout?plan=${encodeURIComponent(plan)}&term=${encodeURIComponent(term)}&locale=${encodeURIComponent(
      locale
    )}`;
    router.push(url);
  };

  return (
    <section className="pt-16 md:pt-24 pb-12 md:pb-16 mx-auto max-w-6xl px-4">
      <header className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--text)]">{t("pricing.title")}</h1>
        <p className="text-[var(--muted)]">{t("pricing.subtitle")}</p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] items-start">
        <div className="grid md:grid-cols-3 gap-4">
          {/* FREE */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-xl font-semibold text-[var(--text)]">{t("plan.free.name")}</h3>
            <p className="text-[var(--muted)] mt-2">{t("plan.free.desc")}</p>

            <ul className="mt-4 space-y-1 text-sm text-[var(--muted)] list-disc pl-5">
              <li>{t("plan.free.bullets.chat")}</li>
              <li>{t("plan.free.bullets.goals")}</li>
              <li>{t("plan.free.bullets.habits")}</li>
              <li>{t("plan.free.bullets.reminders")}</li>
              <li>{t("plan.free.bullets.callTrial")}</li>
            </ul>

            <a
              className="inline-block mt-6 rounded-xl px-4 py-2 border border-[var(--border)] bg-[var(--card)] hover:bg-black/5 dark:hover:bg-white/10 transition"
              href={`/${locale}/chat`}
            >
              {t("cta.startFree")}
            </a>
          </div>

          {/* PLUS */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-xl font-semibold text-[var(--text)]">{t("plan.plus.name")}</h3>
            <p className="text-[var(--text)]/80 mt-1">{t("plan.plus.price")}</p>
            <p className="text-[var(--muted)] mt-2">{t("plan.plus.desc")}</p>

            <button
              onClick={() => openPicker("PLUS")}
              className="inline-flex items-center justify-center mt-6 w-full rounded-xl px-4 py-2 bg-white text-zinc-900 hover:opacity-90 transition"
            >
              {t("cta.choose")}
            </button>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-xl font-semibold text-[var(--text)]">{t("plan.pro.name")}</h3>
            <p className="text-[var(--text)]/80 mt-1">{t("plan.pro.price")}</p>
            <p className="text-[var(--muted)] mt-2">{t("plan.pro.desc")}</p>

            {/* Фиолетовая кнопка — НЕ колхоз, если это твой accent. */}
            <button
              onClick={() => openPicker("PRO")}
              className="inline-flex items-center justify-center mt-6 w-full rounded-xl px-4 py-2 bg-[var(--accent)] text-white hover:opacity-90 transition"
            >
              {t("cta.choose")}
            </button>
          </div>
        </div>

        <div className="lg:pl-4">
          <h2 className="text-2xl font-semibold mb-3 text-[var(--text)]">{t("features.header")}</h2>
          <ul className="space-y-1 text-[var(--muted)] list-disc pl-5">
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* MODAL term picker */}
      {pickerOpen && pickedPlan && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setPickerOpen(false)}
          />
          <div className="absolute inset-x-0 top-24 mx-auto w-[min(520px,calc(100%-24px))] rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-[var(--text)]">
                  {pickedPlan === "PLUS" ? t("picker.title.plus") : t("picker.title.pro")}
                </div>
                <div className="text-sm text-[var(--muted)]">{t("picker.subtitle")}</div>
              </div>
              <button
                className="h-9 w-9 rounded-xl border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setPickerOpen(false)}
                aria-label="Close"
                title={t("picker.close")}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {TERMS.map(({ term, discountLabelKey }) => {
                const isAccent = pickedPlan === "PRO";
                return (
                  <button
                    key={term}
                    onClick={() => startCheckout(pickedPlan, term)}
                    className={[
                      "w-full rounded-xl px-4 py-3 border border-[var(--border)]",
                      "flex items-center justify-between gap-3 transition",
                      "hover:bg-black/5 dark:hover:bg-white/10",
                    ].join(" ")}
                  >
                    <div className="text-[var(--text)] font-medium">
                      {t(`term.${term}`)}
                    </div>

                    <div className="flex items-center gap-2">
                      {discountLabelKey !== "term.discount.none" ? (
                        <span
                          className={[
                            "text-xs px-2 py-1 rounded-full border",
                            isAccent
                              ? "border-[var(--accent)] text-[var(--accent)]"
                              : "border-[var(--border)] text-[var(--muted)]",
                          ].join(" ")}
                        >
                          {t(discountLabelKey)}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">{t(discountLabelKey)}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-xs text-[var(--muted)]">
              {t("picker.note")}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
