// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true
});

// Применяем middleware ко всем страницам сайта,
// исключая /api, /_next и запросы статических файлов.
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
