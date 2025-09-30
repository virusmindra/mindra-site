// next-intl.config.ts
import {getRequestConfig} from 'next-intl/server';
import {getMessages as loadMessages} from './src/i18n';

export default getRequestConfig(async ({locale}) => {
  const current = (locale ?? 'ru') as string;
  const messages = await loadMessages({ locale: current });
  return { locale: current, messages };
});
