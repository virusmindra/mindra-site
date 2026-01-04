import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth-options";
import { getTSync } from "@/lib/getT";
import type { Locale } from "@/i18n";

export const revalidate = 0;

export default async function ThanksPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  const t = getTSync(locale, "thanks");

  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? t("friend");

  return (
    <main className="px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("thanks.title")}</h1>
      <p className="opacity-70">{t("thanks.text")}</p>
      <p className="mt-4 opacity-70">{t("thanks.back")}</p>
      {/* если хочешь показать имя: */}
      {/* <p className="mt-4 opacity-70">{name}</p> */}
    </main>
  );
}
