// src/app/[locale]/pricing/page.tsx
import { getTSync } from "@/lib/getT";
import { getMessagesSync, type Locale } from "@/i18n";

const TERMS = [
  { term: "1M", off: 0 },
  { term: "3M", off: 10 },
  { term: "6M", off: 15 },
  { term: "12M", off: 25 },
] as const;

function buyHref(locale: string, plan: "PLUS" | "PRO", term: "1M" | "3M" | "6M" | "12M") {
  // api route НЕ должен быть внутри [locale], поэтому просто /api/...
  // returnUrl мы зададим на сервере.
  return `/api/stripe/checkout?plan=${plan}&term=${term}&locale=${locale}`;
}

export default function PricingPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = getTSync(locale, "pricing");

  const messages = getMessagesSync(locale, "pricing") as Record<string, unknown>;
  const raw = (messages["features.items"] ?? []) as unknown;
  const features = Array.isArray(raw)
    ? (raw as string[])
    : raw && typeof raw === "object"
      ? Object.values(raw as Record<string, string>)
      : [];

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

            <div className="mt-4 text-sm text-[var(--muted)] space-y-1">
              <div>• 10 chat msgs / month</div>
              <div>• 3 goals / month</div>
              <div>• 3 habits / month</div>
              <div>• 3 reminders / month</div>
              <div>• 3 min call trial</div>
            </div>

            <a
              className="inline-block mt-6 rounded-xl px-4 py-2 border border-[var(--border)] bg-[var(--card)] hover:bg-black/5 dark:hover:bg-white/10 transition"
              href={`/api/auth/signin`}
            >
              {t("cta.startFree")}
            </a>
          </div>

          {/* PLUS */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-xl font-semibold text-[var(--text)]">{t("plan.plus.name")}</h3>
            <p className="text-[var(--text)]/80 mt-1">$19.99 / month</p>
            <p className="text-[var(--muted)] mt-2">{t("plan.plus.desc")}</p>

            <div className="mt-4 space-y-2">
              {TERMS.map(x => (
                <a
                  key={x.term}
                  className="flex items-center justify-between rounded-xl px-4 py-2 border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/10 transition"
                  href={buyHref(locale, "PLUS", x.term)}
                >
                  <span className="text-sm text-[var(--text)]">{t(`term.${x.term}`)}</span>
                  <span className="text-xs text-[var(--muted)]">{x.off ? `-${x.off}%` : ""}</span>
                </a>
              ))}
            </div>
          </div>

          {/* PRO */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h3 className="text-xl font-semibold text-[var(--text)]">{t("plan.pro.name")}</h3>
            <p className="text-[var(--text)]/80 mt-1">$39.99 / month</p>
            <p className="text-[var(--muted)] mt-2">{t("plan.pro.desc")}</p>

            <div className="mt-4 space-y-2">
              {TERMS.map(x => (
                <a
                  key={x.term}
                  className="flex items-center justify-between rounded-xl px-4 py-2 bg-white text-zinc-900 hover:opacity-90 transition"
                  href={buyHref(locale, "PRO", x.term)}
                >
                  <span className="text-sm">{t(`term.${x.term}`)}</span>
                  <span className="text-xs opacity-70">{x.off ? `-${x.off}%` : ""}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:pl-4">
          <h2 className="text-2xl font-semibold mb-3 text-[var(--text)]">{t("features.header")}</h2>
          <ul className="space-y-1 text-[var(--muted)] list-disc pl-5">
            {features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
