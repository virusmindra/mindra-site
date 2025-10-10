// src/components/LegalPage.tsx
"use client";

import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

// Статически подгружаем EN как универсальный fallback
// (пути проверь: у тебя JSON лежат в app/[locale]/messages/*.json)
import enMessages from "@/app/[locale]/messages/en.json";

type Ns = "privacy" | "terms" | "refunds";

export default function LegalPage({
  ns,
  fallback
}: {
  ns: Ns;
  fallback?: ReactNode; // fallback-JSX, если вообще нет секций
}) {
  const t = useTranslations(ns);

  // 1) Пытаемся взять секции из текущей локали
  const currentSections = tryGetArray(() => (t.raw("sections") as unknown));

  // 2) Если секций нет — берём из английского JSON
  const enSections = tryGetArray(() => (enMessages as any)?.[ns]?.sections);

  // 3) Выбор итоговых секций
  const sections = (currentSections.length ? currentSections : enSections);

  // 4) Базовые строки с безопасными фолбэками
  const title        = safeGet(t, "title", defaultTitle(ns));
  const updatedLabel = safeGet(t, "updated", "Last updated");
  const contactLabel = safeGet(t, "contact", "Contact:");

  // Если нет секций ни в локали, ни в EN — можно показать переданный JSX
  if (!sections.length && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral">
      <h1>{title}</h1>
      <p className="text-sm">{updatedLabel}: 30 Sep 2025</p>

      {sections.map((s: any, i: number) => (
        <section key={i}>
          {s?.h && <h2>{s.h}</h2>}
          {s?.p && <p>{s.p}</p>}
          {Array.isArray(s?.ul) && (
            <ul>
              {s.ul.map((li: string, j: number) => (
                <li key={j}>{li}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <hr />
      <p>
        {contactLabel}{" "}
        <a href="mailto:support@mindra.group">support@mindra.group</a>
      </p>
    </div>
  );
}

/* ----------------- helpers ----------------- */

function safeGet(t: ReturnType<typeof useTranslations>, key: string, fb: string) {
  try {
    return t(key);
  } catch {
    return fb;
  }
}

function tryGetArray(getter: () => unknown): any[] {
  try {
    const v = getter();
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function defaultTitle(ns: Ns) {
  if (ns === "privacy") return "Privacy Policy";
  if (ns === "terms") return "Terms of Service";
  return "Refund Policy";
}
