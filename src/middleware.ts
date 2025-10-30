// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true
});

export const config = {
  // исключаем api, _next, статику и favicon
  matcher: ['/((?!api|_next|.*\\..*|favicon.ico).*)'],
};
