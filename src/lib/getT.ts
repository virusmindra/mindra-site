// src/lib/getT.ts
import {createTranslator, type AbstractIntlMessages} from 'next-intl';
import {getMessagesSync, type Locale, type PageKey} from '@/i18n';
import {dotToNested} from '@/lib/i18nShape';

export function getTSync(locale: Locale, page?: PageKey) {
  // Берём плоские "a.b.c" и превращаем в вложенный объект
  const flat = getMessagesSync(locale, page) as Record<string, unknown>;
  const messages = dotToNested(flat) as AbstractIntlMessages;

  const translator = createTranslator({
    locale,
    messages,
    getMessageFallback({ key }) { return key; },
    onError(err) {
      if (process.env.NODE_ENV !== 'production') console.warn(err);
    }
  });

  // ВАЖНО: кастим сам переводчик, чтоб не ловить 'never'
  return translator as unknown as (key: string, values?: Record<string, unknown>) => string;
}
