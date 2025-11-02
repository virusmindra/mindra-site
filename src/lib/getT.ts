// src/lib/getT.ts
import {createTranslator, type AbstractIntlMessages, type IntlError} from 'next-intl';
import {getMessagesSync, type Locale, type PageKey} from '@/i18n';
import {dotToNested} from '@/lib/i18nShape';

export function getTSync(locale: Locale, page?: PageKey) {
  // 1) Берём плоский словарь и превращаем "a.b.c" -> { a: { b: { c } } }
  const flat = getMessagesSync(locale, page) as Record<string, unknown>;
  const messages = dotToNested(flat) as AbstractIntlMessages;

  // 2) Создаём переводчик
  const baseT = createTranslator({
    locale,
    messages,
    // <— ВАЖНО: сюда приходит объект, возвращаем строку по умолчанию
    getMessageFallback({ key }: { key: string; namespace?: string; error: IntlError }) {
      return key;
    },
    onError(err: IntlError) {
      // В проде не шумим для отсутствующих ключей
      if (process.env.NODE_ENV === 'production' && err.code === 'MISSING_MESSAGE') return;
      console.warn(err);
    }
  });

  // 3) Жёстко подсказываем TS сигнатуру t, чтобы не было "never"
  const t = baseT as unknown as (key: string, values?: Record<string, unknown>) => string;

  return t;
}
