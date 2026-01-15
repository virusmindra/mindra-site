// src/app/[locale]/admin/feedback/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth-options";
import { isAdminEmail } from "@/lib/auth/isAdmin";
import { prisma } from "@/server/db/prisma"; // или "@/server/db" — как у тебя реально
// если у тебя prisma экспортируется как prisma из "@/server/db", тогда замени импорт выше.

export const runtime = "nodejs";

function normLocale(raw: string) {
  const l = String(raw || "en").toLowerCase();
  return l.startsWith("es") ? "es" : "en";
}

export default async function AdminFeedbackPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = normLocale(params?.locale);

  // ✅ 1) кто зашел
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  // ✅ 2) не админ -> на чат
  if (!isAdminEmail(email)) {
    redirect(`/${locale}/chat`);
  }

  // ✅ 3) грузим отзывы
  const items = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const T =
    locale === "es"
      ? {
          title: "Admin · Feedback",
          back: "Volver al chat",
          empty: "Aún no hay feedback.",
          user: "Usuario",
          rating: "Rating",
          text: "Texto",
          date: "Fecha",
        }
      : {
          title: "Admin · Feedback",
          back: "Back to chat",
          empty: "No feedback yet.",
          user: "User",
          rating: "Rating",
          text: "Text",
          date: "Date",
        };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{T.title}</h1>
            <p className="text-sm text-[var(--muted)] mt-1">Total: {items.length}</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Admin: {email}
            </p>
          </div>

          <a
            href={`/${locale}/chat`}
            className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-sm"
          >
            {T.back}
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {items.length === 0 ? (
            <div className="p-6 text-sm text-[var(--muted)]">{T.empty}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/10 dark:bg-white/5">
                  <tr className="text-left">
                    <th className="px-4 py-3 w-[170px]">{T.date}</th>
                    <th className="px-4 py-3 w-[90px]">{T.rating}</th>
                    <th className="px-4 py-3 w-[240px]">{T.user}</th>
                    <th className="px-4 py-3">{T.text}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f: any) => (
                    <tr key={f.id} className="border-t border-[var(--border)] align-top">
                      <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">
                        {new Date(f.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span className="px-2 py-1 rounded-lg border border-[var(--border)]">
                            {f.rating}★
                          </span>
                          {f.locale ? (
                            <span className="text-[11px] text-[var(--muted)]">{f.locale}</span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)] break-all">
                        {f.userEmail || f.userId || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-pre-wrap">{f.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-[var(--muted)]">
          Admin only · Protected by <code>isAdminEmail()</code>
        </div>
      </div>
    </div>
  );
}
