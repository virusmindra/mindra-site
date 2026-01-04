import Link from "next/link";
import { getTSync } from "@/lib/getT";
import type { Locale } from "@/i18n";

export default function Footer({ locale }: { locale: Locale }) {
  const t = getTSync(locale);
  const year = new Date().getFullYear();

return (
  <footer className="mt-16 border-t border-[var(--border)] bg-[var(--bg)]">
    <div className="w-full px-6 py-10">
      <div className="max-w-6xl mx-auto w-full text-sm text-[var(--text)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="text-[var(--muted)]">© {year} Mindra Group LLC</span>

          <nav aria-label={t("footer.legalNavAria")}>
            <ul className="flex flex-wrap gap-4">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-[var(--muted)] hover:text-[var(--text)] hover:underline"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-[var(--muted)] hover:text-[var(--text)] hover:underline"
                >
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/refunds`}
                  className="text-[var(--muted)] hover:text-[var(--text)] hover:underline"
                >
                  {t("footer.refunds")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/support`}
                  className="text-[var(--muted)] hover:text-[var(--text)] hover:underline"
                >
                  {t("footer.support")}
                </Link>
              </li>

              <li>
                <a
                  href="/api/portal"
                  className="text-[var(--muted)] hover:text-[var(--text)] hover:underline"
                >
                  {t("footer.portal")}
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <p className="mt-3 text-[var(--muted)]">{t("footer.disclaimer")}</p>

        <p className="text-[var(--muted)]">
          {t("footer.contact")}{" "}
          <a className="hover:underline hover:text-[var(--text)]" href="mailto:support@mindra.group">
            support@mindra.group
          </a>
        </p>
      </div>
    </div>
  </footer>
);
}