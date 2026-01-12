"use client";

import { useState } from "react";

type Plan = "PLUS" | "PRO";
type Term = "1M" | "3M" | "6M" | "12M";

const DISCOUNT: Record<Term, number> = {
  "1M": 0,
  "3M": 10,
  "6M": 15,
  "12M": 25,
};

function priceFor(plan: Plan, term: Term) {
  const base = plan === "PLUS" ? 19.99 : 39.99;
  const months = term === "1M" ? 1 : term === "3M" ? 3 : term === "6M" ? 6 : 12;
  const discount = DISCOUNT[term] / 100;
  const total = base * months * (1 - discount);
  const perMonth = total / months;
  return { base, months, discountPct: DISCOUNT[term], total, perMonth };
}

export default function PricingBuyModal({
  locale,
  t,
}: {
  locale: "en" | "es";
  t: (k: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<Plan>("PLUS");
  const [busy, setBusy] = useState(false);

  const terms: Term[] = ["1M", "3M", "6M", "12M"];

  const openFor = (p: Plan) => {
    setPlan(p);
    setOpen(true);
  };

  const buy = async (term: Term) => {
    setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, term, locale }),
      });
      const j = await r.json().catch(() => null);
      if (j?.url) {
        location.href = j.url;
        return;
      }
      alert(j?.error || "Checkout error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Buttons you place inside cards */}
      <div className="flex gap-2">
        <button
          onClick={() => openFor("PLUS")}
          className="w-full rounded-xl px-4 py-2 bg-white text-zinc-900 hover:opacity-90"
        >
          {t("cta.buyPlus")}
        </button>

        <button
          onClick={() => openFor("PRO")}
          className="w-full rounded-xl px-4 py-2 border border-[var(--border)] bg-[var(--card)] hover:bg-black/5 dark:hover:bg-white/10"
        >
          {t("cta.buyPro")}
        </button>
      </div>

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => (busy ? null : setOpen(false))}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-[var(--text)]">
                  {t("modal.title")}
                </div>
                <div className="text-sm text-[var(--muted)] mt-1">
                  {t("modal.subtitle")}{" "}
                  <span className="font-medium text-[var(--text)]">
                    {plan === "PLUS" ? "Plus" : "Pro"}
                  </span>
                </div>
              </div>

              <button
                className="text-[var(--muted)] hover:text-[var(--text)]"
                onClick={() => (busy ? null : setOpen(false))}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {terms.map((term) => {
                const p = priceFor(plan, term);
                const badge =
                  term === "12M"
                    ? t("modal.best")
                    : term === "6M"
                      ? t("modal.popular")
                      : "";

                return (
                  <button
                    key={term}
                    disabled={busy}
                    onClick={() => buy(term)}
                    className="w-full text-left rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:bg-black/5 dark:hover:bg-white/10 transition disabled:opacity-60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--text)]">
                          {term === "1M"
                            ? t("term.1m")
                            : term === "3M"
                              ? t("term.3m")
                              : term === "6M"
                                ? t("term.6m")
                                : t("term.12m")}
                          {p.discountPct > 0 ? (
                            <span className="ml-2 text-xs text-[var(--muted)]">
                              -{p.discountPct}%
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-[var(--muted)] mt-1">
                          {t("modal.perMonth")}{" "}
                          <span className="text-[var(--text)] font-medium">
                            ${p.perMonth.toFixed(2)}
                          </span>
                          /mo · {t("modal.total")}{" "}
                          <span className="text-[var(--text)] font-medium">
                            ${p.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {badge ? (
                        <span className="text-[11px] px-2 py-1 rounded-full bg-[var(--accent)] text-white">
                          {badge}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--muted)]">
                          {t("modal.choose")}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 text-xs text-[var(--muted)]">
              {t("modal.note")}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
