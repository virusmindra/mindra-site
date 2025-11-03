// src/lib/getT.ts
import {createTranslator, type AbstractIntlMessages, type IntlError} from 'next-intl';
import {getMessagesSync, type Locale, type PageKey} from '@/i18n';
import {dotToNested} from '@/lib/i18nShape';

export function getTSync(locale: Locale, page?: PageKey) {
  // берём плоский словарь и превращаем "a.b" -> {a:{b:…}}
  const flat = getMessagesSync(locale, page) as Record<string, unknown>;
  const messages = dotToNested(flat) as AbstractIntlMessages;

  const base = createTranslator({
    locale,
    messages,
    getMessageFallback({ key }) { return key; },
    onError(err: IntlError) {
      if (process.env.NODE_ENV !== 'production') console.warn(err);
    }
  });

  // Жёстко подсказываем сигнатуру — без "never"
  const t = base as unknown as (key: string, values?: Record<string, unknown>) => string;
  return (key: string, values?: Record<string, unknown>) => t(key, values);
}
