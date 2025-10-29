// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n';

export default createMiddleware({
  locales: Array.from(locales),
  defaultLocale,
  localeDetection: true
});

// Матчим корень и любые пути с префиксом локали
export const config = {
  matcher: ['/', '/(en|ru|uk|pl|es|fr|de|kk|hy|ka|md)/:path*']
};
