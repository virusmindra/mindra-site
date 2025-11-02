// src/lib/getT.ts
import {createTranslator, type AbstractIntlMessages} from 'next-intl';
import {getMessagesSync, type Locale, type PageKey} from '@/i18n';

export function getTSync(locale: Locale, page?: PageKey) {
  const messages = getMessagesSync(locale, page) as AbstractIntlMessages;

  // Жёстко подсказываем сигнатуру переводчика,
  // чтобы избежать "Argument of type 'string' is not assignable to parameter of type 'never'"
  const baseT = createTranslator({
    locale,
    messages,
    getMessageFallback({key}) {
      return key; // фолбэк — показываем ключ вместо падения
    },
    onError(err) {
      if (process.env.NODE_ENV === 'production' && (err as any)?.code === 'MISSING_MESSAGE') return;
      console.warn(err);
    }
  }) as unknown as (key: string, values?: Record<string, unknown>) => string;

  // Возвращаем функцию со стабильной сигнатурой
  return (key: string, values?: Record<string, unknown>) => baseT(key, values);
}

// Асинхронный удобный враппер для server components
export async function getT(opts: {locale: Locale; page?: PageKey}) {
  return getTSync(opts.locale, opts.page);
}
