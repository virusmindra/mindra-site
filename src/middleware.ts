// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true
});

export const config = {
  matcher: [
    '/',                                    // корень
    '/(en|ru|uk|pl|es|fr|de|kk|hy|ka|md)/:path*', // локализованные пути
    '/((?!api|_next|.*\\..*).*)'            // и общее правило на все страницы, кроме API/статических файлов
  ]
};
