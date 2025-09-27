import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'],
  defaultLocale: 'ru',
  localeDetection: true
});

export const config = {
  matcher: ['/', '/(ru|en|uk|pl|es|fr|de|kk|hy|ka|md)/:path*']
};
