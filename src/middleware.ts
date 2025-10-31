// src/middleware.ts
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

const locales = ['ru','en','uk','pl','es','fr','de','kk','hy','ka','md'] as const;
const defaultLocale = 'en';

export function middleware(req: NextRequest) {
  const {pathname} = req.nextUrl;

  // Пропускаем api, _next и файлы (включая favicon)
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || /\.\w+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Если уже есть префикс локали — пропускаем
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return NextResponse.next();
  }

  // Иначе — редиректим на дефолтную локаль
  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
