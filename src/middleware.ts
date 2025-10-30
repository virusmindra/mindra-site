import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from '@/i18n';

export default createMiddleware({ locales, defaultLocale });

export const config = {
  matcher: ['/', '/(ru|en|uk|pl|es|fr|de|kk|hy|ka|md)/:path*'],
};
