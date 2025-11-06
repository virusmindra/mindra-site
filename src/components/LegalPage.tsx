// НЕТ "use client"
import { getTSync } from "@/lib/getT";
import type { Locale } from "@/i18n";

type NS = "privacy" | "terms" | "refunds";

export default function LegalPage({
  ns,
  locale,
  fallback,
}: {
  ns: NS;
  locale: Locale;
  fallback?: React.ReactNode;
}) {
  const t = getTSync(locale);

  // Типобезопасный вызов .raw с падением в undefined, если метода нет
  const doc =
    (typeof (t as any).raw === "function"
      ? (t as any).raw(ns)
      : undefined) as
      | { title?: string; updated?: string; contact?: string; sections?: any[] }
      | undefined;

  // Если нет объектной записи, попробуем собрать минимум из строковых ключей
  const fallbackDoc =
    doc ?? {
      title: safe(t, `${ns}.title`),
      updated: safe(t, `${ns}.updated`),
      contact: safe(t, `${ns}.contact`),
      // секции без .raw достать нельзя — оставим пустыми
      sections: [] as any[],
    };

  if (
    (!fallbackDoc.title && !fallbackDoc.sections?.length) &&
    !fallback
  ) {
    return null;
  }
  if (!fallbackDoc.title && !fallbackDoc.sections?.length && fallback) {
    return <>{fallback}</>;
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>{fallbackDoc.title ?? "Legal"}</h1>
      {fallbackDoc.updated && (
        <p>
          {safe(t, `${ns}.updated`) ?? "Last updated"}: {fallbackDoc.updated}
        </p>
      )}

      {Array.isArray(fallbackDoc.sections) &&
        fallbackDoc.sections.map((sec: any, i: number) => (
          <section key={i}>
            {sec?.h && <h2>{sec.h}</h2>}
            {sec?.p && <p>{sec.p}</p>}
            {Array.isArray(sec?.ul) && (
              <ul>
                {sec.ul.map((li: string, j: number) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
    </article>
  );
}

function safe(t: (k: string) => string, key: string): string | undefined {
  try {
    const v = t(key);
    // если i18n вернёт сам ключ — считаем, что перевода нет
    if (typeof v === "string" && v !== key) return v;
  } catch {
    /* ignore */
  }
  return undefined;
}
