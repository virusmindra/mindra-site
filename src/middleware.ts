// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
});

export const config = {
  matcher: [
    // исключаем api, _next, любые файлы (.*\..*) и favicon.ico
    '/((?!api|_next|.*\\..*|favicon.ico).*)',
  ],
};
