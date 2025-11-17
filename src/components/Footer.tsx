import Link from "next/link";
import { getTSync } from "@/lib/getT";
import type { Locale } from "@/i18n";

export default function Footer({ locale }: { locale: Locale }) {
  const t = getTSync(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="opacity-70">© {year} Mindra Group LLC</span>
          <nav aria-label={t("footer.legalNavAria")}>
            <ul className="flex flex-wrap gap-4">
              <li>
                <Link href={`/${locale}/privacy`} className="hover:underline">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="hover:underline">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/refunds`} className="hover:underline">
                  {t("footer.refunds")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/support`} className="hover:underline">
                  {t("footer.support")}
                </Link>
              </li>

              {/* ВАЖНО: больше никакого /{locale}/billing/portal */}
              <li>
                <a href="/api/portal" className="hover:underline">
                  {t("footer.portal")}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-3 opacity-70">{t("footer.disclaimer")}</p>
        <p className="opacity-70">
          {t("footer.contact")}{" "}
          <a className="hover:underline" href="mailto:support@mindra.group">
            support@mindra.group
          </a>
        </p>
      </div>
    </footer>
  );
}
