// next-intl.config.ts
import {getRequestConfig} from 'next-intl/server';
import {getMessages} from './src/i18n';

export default getRequestConfig(async ({locale}) => {
  const current = (locale as string) || 'ru';
  const messages = await getMessages({locale: current});
  return {locale: current, messages};
});
