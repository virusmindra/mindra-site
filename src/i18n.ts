import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  // Храним JSON рядом: src/app/[locale]/messages/<locale>.json
  const messages = (await import(`./app/[locale]/messages/${locale}.json`)).default;
  return {messages};
});
