"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {useTranslations, useLocale} from "next-intl";

export default function CookieBanner() {
  const t = useTranslations("cookie");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // показываем баннер только если согласия ещё нет
    if (typeof window !== "undefined" && !localStorage.getItem("cookie-consent")) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const privacyHref = `/${locale}/privacy`;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50"
      role="dialog"
      aria-live="polite"
      aria-label={t("bannerAria")}
    >
      <div className="mx-auto max-w-4xl m-3 rounded-xl border bg-white p-4 shadow">
        <p className="text-sm text-neutral-700">
          {t("text")}{" "}
          <Link href={privacyHref} className="underline">
            {t("more")}
          </Link>.
        </p>

        <div className="mt-3 flex gap-2">
          <button
            className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
            aria-label={t("acceptAria")}
            onClick={() => {
              localStorage.setItem("cookie-consent", "accepted");
              setVisible(false);
            }}
          >
            {t("accept")}
          </button>

          <Link
            className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
            href={privacyHref}
            aria-label={t("moreAria")}
          >
            {t("details")}
          </Link>
        </div>
      </div>
    </div>
  );
}
