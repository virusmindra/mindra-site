// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
const defaultLocale = 'en';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Пропускаем API, _next и любые файлы
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    /\.\w+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Уже есть префикс локали — пропускаем
  if (locales.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return NextResponse.next();
  }

  // Иначе редиректим на дефолтную локаль
  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // ВНИМАНИЕ: api исключён
  matcher: ['/((?!_next|favicon.ico|robots.txt|sitemap.xml|images|api|.*\\..*).*)'],
};
