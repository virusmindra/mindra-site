import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'],
  defaultLocale: 'ru',
  localeDetection: true
});

export const config = {
  // накрываем корень и все локализованные префиксы
  matcher: ['/', '/(ru|en|uk|pl|es|fr|de|kk|hy|ka|md)/:path*']
};
