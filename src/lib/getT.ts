// src/lib/getT.ts
import {getMessages} from 'next-intl/server';
import {createTranslator} from 'next-intl';

type Opts = {
  locale: string;
  namespace?: string;
};

export async function getT({locale, namespace}: Opts) {
  const messages = await getMessages({locale});

  const t = createTranslator({
    locale,
    messages,
    namespace,
    // Не валим билд на MISSING_MESSAGE и показываем ключ
    onError() {},
    getMessageFallback: ({key}) => key
  });

  return t;
}
