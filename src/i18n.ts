// статические JSON из твоих файлов
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

export const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en';

export const messagesByLocale: Record<Locale, any> = {
  en, ru, uk, pl, es, fr, de, kk, hy, ka, md
};

// Синхронно получаем словарь (без next-intl/server)
export function getMessagesSync(locale: string) {
  return messagesByLocale[(locale as Locale)] ?? messagesByLocale[defaultLocale];
}
