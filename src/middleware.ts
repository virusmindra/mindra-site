// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["ru","en","uk","pl","es","fr","de","kk","hy","ka","md"] as const;
const defaultLocale = "en";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Пропускаем API в любом виде:
  // /api/...  И  /{locale}/api/...
  if (
    pathname.startsWith("/api") ||
    locales.some((l) => pathname.startsWith(`/${l}/api`)) ||
    pathname.startsWith("/_next") ||
    /\.\w+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Уже есть префикс локали — пропускаем
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return NextResponse.next();
  }

  // Иначе редиректим на дефолтную локаль
  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // ✅ исключаем /api и /{locale}/api
    "/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|images|.*\\..*|ru/api|en/api|uk/api|pl/api|es/api|fr/api|de/api|kk/api|hy/api|ka/api|md/api).*)",
  ],
};
