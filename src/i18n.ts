// src/i18n.ts
export const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'ru';

import ru from '@/app/[locale]/messages/ru.json';
import en from '@/app/[locale]/messages/en.json';
import uk from '@/app/[locale]/messages/uk.json';
import pl from '@/app/[locale]/messages/pl.json';
import es from '@/app/[locale]/messages/es.json';
import fr from '@/app/[locale]/messages/fr.json';
import de from '@/app/[locale]/messages/de.json';
import kk from '@/app/[locale]/messages/kk.json';
import hy from '@/app/[locale]/messages/hy.json';
import ka from '@/app/[locale]/messages/ka.json';
import md from '@/app/[locale]/messages/md.json';

// Карта словарей
export const dictionaries: Record<Locale, Record<string, any>> = {
  ru, en, uk, pl, es, fr, de, kk, hy, ka, md
};

// Синхронная выдача словаря
export function getMessagesSync(locale: Locale) {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
