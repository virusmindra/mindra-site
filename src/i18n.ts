// src/i18n.ts
type Dict = Record<string, any>;

// Статические импорты — webpack точно упакует эти файлы
import enBase from "@/app/[locale]/messages/en.json";
import ruBase from "@/app/[locale]/messages/ru.json";
// при необходимости добавь ещё:
// import deBase from "@/app/[locale]/messages/de.json"; ...

const baseByLocale: Record<string, Dict> = {
  en: enBase ?? {},
  ru: ruBase ?? {},
  // de: deBase ?? {},
  // ...
};

function deepMerge<A extends Dict, B extends Dict>(a: A, b: B): A & B {
  const out: Dict = Array.isArray(a) ? [...a] : { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge((out[k] ?? {}) as Dict, v as Dict);
    } else {
      out[k] = v;
    }
  }
  return out as A & B;
}

export async function getMessages({ locale }: { locale: string }) {
  const fallback = "en";
  const cur = baseByLocale[locale] ?? {};
  const fb  = baseByLocale[fallback] ?? {};

  // Простой рабочий merge: fallback -> current
  const merged = deepMerge(fb, cur);

  // ВАЖНО: возвращаем сериализуемый plain-object
  return JSON.parse(JSON.stringify(merged));
}
