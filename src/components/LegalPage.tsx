// src/components/LegalPage.tsx  (без "use client")
import { getTSync } from "@/lib/getT";
import type { Locale } from "@/i18n";

type NS = "privacy" | "terms" | "refunds";
type Section = { h?: string; p?: string; ul?: string[] };
type Doc = {
  title?: string;
  updatedLabel?: string;  // лейбл "Последнее обновление"
  updated?: string;       // дата, например "30 сентября 2025 г."
  contactLabel?: string;  // лейбл "Контакт"
  sections?: Section[];
};

export default function LegalPage({
  ns,
  locale,
  fallback
}: {
  ns: NS;
  locale: Locale;
  fallback?: React.ReactNode;
}) {
  // t.raw существует на рантайме, типы у getTSync просто не включают raw — делаем мягкий каст
  const t: any = getTSync(locale);
  const doc: Doc = (t?.raw?.(ns) ?? {}) as Doc;

  // если нет ни заголовка, ни секций — показываем переданный fallback (если есть)
  if (!doc.title && !(doc.sections && doc.sections.length)) {
    return <>{fallback ?? null}</>;
  }

  const updatedLabel = doc.updatedLabel ?? "Last updated";
  const contactLabel = doc.contactLabel ?? "Contact";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>{doc.title ?? "Legal"}</h1>

      {doc.updated && (
        <p className="text-sm">
          {updatedLabel}: {doc.updated}
        </p>
      )}

      {Array.isArray(doc.sections) &&
        doc.sections.map((sec, i) => (
          <section key={i}>
            {sec.h && <h2>{sec.h}</h2>}
            {sec.p && <p>{sec.p}</p>}
            {Array.isArray(sec.ul) && (
              <ul>{sec.ul.map((li, j) => <li key={j}>{li}</li>)}</ul>
            )}
          </section>
        ))}

      <hr />
      <p>
        {contactLabel}: <a href="mailto:support@mindra.group">support@mindra.group</a>
      </p>
    </article>
  );
}
