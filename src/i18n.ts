// src/i18n.ts
import type { Locale } from '@/locales';

// ⬇️ JSON-словарики: строго чистый JSON без функций/JSX
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

const dict: Record<Locale, any> = {
  en, ru, uk, pl, es, fr, de, kk, hy, ka, md,
} as const;

// Возвращаем «чистые» сообщения для next-intl / createTranslator
export function getMessagesFor(locale: Locale) {
  return dict[locale] ?? en; // fallback на en
}

export const defaultLocale: Locale = 'en';
