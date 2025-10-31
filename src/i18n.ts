// src/i18n.ts
export const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';

// Импорты JSON (Next/TS с resolveJsonModule подтянет как объекты)
import en from '@/app/[locale]/messages/en.json';
import ru from '@/app/[locale]/messages/ru.json';
import uk from '@/app/[locale]/messages/uk.json';
import pl from '@/app/[locale]/messages/pl.json';
import es from '@/app/[locale]/messages/es.json';
import fr from '@/app/[locale]/messages/fr.json';
import de from '@/app/[locale]/messages/de.json';
import kk from '@/app/[locale]/messages/kk.json';
import hy from '@/app/[locale]/messages/hy.json';
import ka from '@/app/[locale]/messages/ka.json';
import md from '@/app/[locale]/messages/md.json';

// Разрешаем вложенные структуры
type Messages = Record<string, unknown>;

const MAP: Record<Locale, Messages> = { en, ru, uk, pl, es, fr, de, kk, hy, ka, md };

// Достаём по "dot.path" (hero.title, footer.copy и т.п.)
function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function getMessagesSync(locale: Locale): Messages {
  return MAP[locale] ?? en;
}

// Наш мини-транслятор с безопасным доступом
export function createT(locale: Locale) {
  const dict = getMessagesSync(locale);
  return (key: string) => {
    const val = getByPath(dict, key);
    return typeof val === 'string' ? val : key; // если нет строки — вернём ключ (и ничего не падает)
  };
}
