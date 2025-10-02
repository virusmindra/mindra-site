// src/middleware.ts
import createMiddleware from "next-intl/middleware";
import {locales, defaultLocale} from "./i18n";

// ВАЖНО: никаких "localizations"
export default createMiddleware({
  locales: Array.from(locales as readonly string[]),
  defaultLocale,
  // необязательно, но удобно:
  // localePrefix: 'as-needed',   // если поддерживается твоей версией next-intl
  // localeDetection: true
});

// Матчер, который исключает /api, /_next и файлы
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
