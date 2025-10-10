"use client";

import Link from "next/link";
import {useTranslations, useLocale} from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();

  // Локализованный путь: /{locale}/path
  const l = (path: string) => `/${locale}${path.startsWith("/") ? path : `/${path}`}`;

  return (
    <footer className="mt-16 border-t border-white/10 py-8 text-sm opacity-70" aria-labelledby="site-footer">
      <h2 id="site-footer" className="sr-only">{t("footerLabel")}</h2>

      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-neutral-500 dark:text-neutral-400">
          <p aria-label={t("copyrightAria")}>© {new Date().getFullYear()} Mindra Group LLC</p>

          <nav className="flex items-center gap-6" aria-label={t("legalNavAria")}>
            <Link className="hover:text-neutral-800 dark:hover:text-neutral-200 underline-offset-2 hover:underline" href={l("/privacy")}>
              {t("privacy")}
            </Link>
            <Link className="hover:text-neutral-800 dark:hover:text-neutral-200 underline-offset-2 hover:underline" href={l("/terms")}>
              {t("terms")}
            </Link>
            <Link className="hover:text-neutral-800 dark:hover:text-neutral-200 underline-offset-2 hover:underline" href={l("/refunds")}>
              {t("refunds")}
            </Link>
            {/* ВАЖНО: ведём к блоку контактов на странице поддержки */}
            <Link className="hover:text-neutral-800 dark:hover:text-neutral-200 underline-offset-2 hover:underline" href={l("/support#contacts")}>
              {t("support")}
            </Link>
            {/* Портал Stripe */}
            <Link className="hover:text-neutral-800 dark:hover:text-neutral-200 underline-offset-2 hover:underline" href={l("/billing/portal")}>
              {t("portal")}
            </Link>
          </nav>
        </div>

        <p className="mt-3 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
          {t("disclaimer")}
        </p>

        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {t("contact")}:{" "}
          <a className="underline hover:text-neutral-800 dark:hover:text-neutral-200" href="mailto:support@mindra.group">
            support@mindra.group
          </a>
        </div>
      </div>
    </footer>
  );
}
