// src/components/LegalPage.tsx
import type { Locale } from "@/i18n";

type NS = "privacy" | "terms" | "refunds";
type Section = { h?: string; p?: string; ul?: string[] };
type Doc = {
  title?: string;
  updatedLabel?: string; // лейбл "Последнее обновление"
  updated?: string;      // дата ИЛИ лейбл (в старых JSON) — учтём оба варианта
  contactLabel?: string;
  sections?: Section[];
};

async function loadMessages(locale: string) {
  try {
    const mod = await import(`@/app/[locale]/(site)/messages/${locale}.json`);
    return mod.default as Record<string, unknown>;
  } catch {
    const mod = await import(`@/app/[locale]/(site)/messages/en.json`);
    return mod.default as Record<string, unknown>;
  }
}

export default async function LegalPage({
  ns,
  locale,
  fallback,
}: {
  ns: NS;
  locale: Locale;
  fallback?: React.ReactNode;
}) {
  const messages = await loadMessages(locale);
  const en = await loadMessages("en");

  const doc = (messages?.[ns] ?? en?.[ns] ?? {}) as Doc;

  const sections = Array.isArray(doc.sections) ? doc.sections : [];

  if (!doc.title && sections.length === 0) {
    return <>{fallback ?? null}</>;
  }

  const updatedLabel = doc.updatedLabel ?? "Last updated";
  // выводим «обновлено» только если значение похоже на дату/текст с цифрами
  const updatedDate =
    typeof doc.updated === "string" && /\d/.test(doc.updated) ? doc.updated : undefined;

  const contactLabel = doc.contactLabel ?? "Contact";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>{doc.title ?? "Legal"}</h1>

      {updatedDate && (
        <p className="text-sm">
          {updatedLabel}: {updatedDate}
        </p>
      )}

      {sections.map((sec, i) => (
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
