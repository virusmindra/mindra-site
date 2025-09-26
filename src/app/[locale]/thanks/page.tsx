import {useTranslations} from "next-intl";
import Link from "next/link";
import {TELEGRAM_URL} from "@/lib/links";

export default function ThanksPage() {
  const t = useTranslations();
  return (
    <section className="py-14">
      <h1 className="text-4xl font-semibold">{t("thanks.title")}</h1>
      <p className="mt-3 max-w-2xl opacity-90">{t("thanks.text")}</p>
      <div className="mt-6 flex gap-3">
        <Link href="../" className="rounded-xl border border-white/20 px-4 py-2">{t("thanks.back")}</Link>
        <a href={TELEGRAM_URL} target="_blank" rel="noopener" className="rounded-xl bg-white text-zinc-900 px-4 py-2">{t("thanks.tg")}</a>
      </div>
    </section>
  );
}
