import {useTranslations} from "next-intl";
import {DONATE_URL} from "@/lib/links";

export default function DonatePage() {
  const t = useTranslations();

  return (
    <section className="py-10">
      <h1 className="text-4xl font-semibold">{t("donate.title")}</h1>
      <p className="mt-3 text-zinc-300">{t("donate.subtitle")}</p>

      <a
        className="inline-block mt-6 rounded-xl px-5 py-3 bg-white text-zinc-900"
        href={DONATE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("donate.cta")}
      </a>

      <p className="mt-6 opacity-80">{t("donate.note")}</p>
    </section>
  );
}
