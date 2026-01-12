// src/app/[locale]/pricing/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMessagesSync, type Locale } from "@/i18n";
import { getTSync } from "@/lib/getT";

type Plan = "PLUS" | "PRO";
type Term = "1M" | "3M" | "6M" | "12M";

const TERMS = [
  { term: "1M", discountLabelKey: "term.noDiscount" },
  { term: "3M", discountLabelKey: "term.discount10" },
  { term: "6M", discountLabelKey: "term.discount15" },
  { term: "12M", discountLabelKey: "term.discount25" },
] as const;


export default function PricingPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = getTSync(locale, "pricing");
  const router = useRouter();

  const [loading, setLoading] = useState(false);

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

  const startCheckout = (plan: Plan, term: Term) => {
  setLoading(true);
  const url = `/api/checkout?plan=${encodeURIComponent(plan)}&term=${encodeURIComponent(term)}&locale=${encodeURIComponent(locale)}`;
  router.push(url);
};

const plusItems = useMemo(() => {
  const raw = (messages["plan.plus.items"] ?? []) as unknown;
  return Array.isArray(raw)
    ? (raw as string[])
    : raw && typeof raw === "object"
      ? Object.values(raw as Record<string, string>)
      : [];
}, [messages]);

const proItems = useMemo(() => {
  const raw = (messages["plan.pro.items"] ?? []) as unknown;
  return Array.isArray(raw)
    ? (raw as string[])
    : raw && typeof raw === "object"
      ? Object.values(raw as Record<string, string>)
      : [];
}, [messages]);

  return (
  <section className="pt-16 md:pt-24 pb-12 md:pb-16 mx-auto max-w-6xl px-4">
    <header className="text-center space-y-3">
      <h1 className="text-3xl md:text-4xl font-semibold text-[var(--text)]">
        {t("pricing.title")}
      </h1>
      <p className="text-[var(--muted)]">{t("pricing.subtitle")}</p>
    </header>

    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] items-start">
      <div className="grid md:grid-cols-3 gap-4">
        {/* FREE */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col">
          {/* TOP */}
          <div>
            <h3 className="text-xl font-semibold text-[var(--text)]">{t("plan.free.name")}</h3>
            <p className="text-[var(--muted)] mt-2">{t("plan.free.desc")}</p>

            <ul className="mt-4 space-y-1 text-sm text-[var(--muted)] list-disc pl-5">
              <li>{t("plan.free.bullets.chat")}</li>
              <li>{t("plan.free.bullets.goals")}</li>
              <li>{t("plan.free.bullets.habits")}</li>
              <li>{t("plan.free.bullets.reminders")}</li>
              <li>{t("plan.free.bullets.callTrial")}</li>
            </ul>
          </div>

          {/* BOTTOM (always aligned) */}
          <div className="mt-auto pt-6">
            <a
              className="inline-flex items-center justify-center w-full rounded-xl px-4 py-2 font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-black/5 dark:hover:bg-white/10 transition"
              href={`/${locale}/chat`}
            >
              {t("cta.startFree")}
            </a>
          </div>
        </div>

        {/* PLUS */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col">
          {/* TOP */}
          <div>
            <h3 className="text-xl font-semibold text-[var(--text)]">{t("plan.plus.name")}</h3>
            <p className="text-[var(--text)]/80 mt-1">{t("plan.plus.price")}</p>
            <p className="text-[var(--muted)] mt-2">{t("plan.plus.desc")}</p>

            {/* если у тебя есть items массив — лучше так; если нет, можно удалить */}
            {plusItems.length > 0 && (
  <ul className="mt-4 space-y-1 text-sm text-[var(--muted)] list-disc pl-5">
    {plusItems.map((x, i) => (
      <li key={i}>{x}</li>
    ))}
  </ul>
)}

          </div>

          {/* BOTTOM (always aligned) */}
          <div className="mt-auto pt-6">
            <button
              onClick={() => openPicker("PLUS")}
              disabled={loading}
              className="w-full rounded-xl px-4 py-2 font-medium bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50 transition disabled:cursor-not-allowed"
            >
              {loading ? t("cta.loading") : t("cta.choosePlan")}
            </button>
          </div>
        </div>

        {/* PRO */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 flex flex-col">
          {/* TOP */}
          <div>
            <h3 className="text-xl font-semibold text-[var(--text)]">{t("plan.pro.name")}</h3>
            <p className="text-[var(--text)]/80 mt-1">{t("plan.pro.price")}</p>
            <p className="text-[var(--muted)] mt-2">{t("plan.pro.desc")}</p>

            {proItems.length > 0 && (
  <ul className="mt-4 space-y-1 text-sm text-[var(--muted)] list-disc pl-5">
    {proItems.map((x, i) => (
      <li key={i}>{x}</li>
    ))}
  </ul>
)}

          </div>

          {/* BOTTOM (always aligned) */}
          <div className="mt-auto pt-6">
            <button
              onClick={() => openPicker("PRO")}
              disabled={loading}
              className="w-full rounded-xl px-4 py-2 font-medium text-white bg-[var(--accent)] hover:opacity-90 transition disabled:cursor-not-allowed"
            >
              {loading ? t("cta.loading") : t("cta.choosePlan")}
            </button>
          </div>
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
  <div className="fixed inset-0 z-50 flex items-start justify-center pt-28 md:pt-32 px-4">
    {/* overlay */}
    <button
      className="absolute inset-0 bg-black/60"
      onClick={() => setPickerOpen(false)}
      aria-label="Close"
    />

    {/* modal */}
    <div
      className={[
        "relative w-full max-w-xl rounded-2xl border border-[var(--border)] p-6 shadow-2xl",
        "bg-white text-zinc-900",          // light
        "dark:bg-zinc-900 dark:text-white" // dark ✅
      ].join(" ")}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
  <div>
    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
      {t("modal.title", {
        plan: pickedPlan === "PLUS"
          ? t("plan.plus.name")
          : t("plan.pro.name"),
      })}
    </h3>

    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      {t("modal.subtitle")}
    </p>
  </div>

  <button
    onClick={() => setPickerOpen(false)}
    className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 py-1
               text-zinc-600 dark:text-zinc-300
               hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
    aria-label={t("modal.close")}
    title={t("modal.close")}
  >
    ✕
  </button>
      </div>

      <div className="mt-5 space-y-2">
        {TERMS.map(({ term, discountLabelKey }) => (
          <button
      key={term}
      onClick={() => {
        setPickerOpen(false);
        startCheckout(pickedPlan, term);
      }}
      className="
        w-full rounded-xl
        border border-zinc-200
        bg-white hover:bg-zinc-50
        px-4 py-3 text-left transition
      "
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium text-zinc-900">
          {t(`term.${term}`)}
        </div>

        <span
          className="
            text-xs px-2 py-1 rounded-full
            border border-zinc-200
            bg-white text-zinc-600
          "
        >
          {t(discountLabelKey)}
        </span>
      </div>
    </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-[var(--muted)]">{t("modal.footer")}</p>
    </div>
  </div>
)}
  </section>
);
}