export const runtime = "nodejs";

async function getData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/subscriptions`, {
    cache: "no-store",
    // куки/сессия уйдут сами в server component
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<{
    rows: any[];
    pending: any[];
  }>;
}

export default async function AdminSubscriptionsPage() {
  const { rows, pending } = await getData();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Subscriptions</h1>

      <div className="mt-4 overflow-x-auto border border-[var(--border)] rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--card)]">
            <tr className="text-left">
              <th className="p-3">User</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Term</th>
              <th className="p-3">Status</th>
              <th className="p-3">Period End</th>
              <th className="p-3">Stripe Customer</th>
              <th className="p-3">Stripe Sub</th>
              <th className="p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.userId} className="border-t border-[var(--border)]">
                <td className="p-3">
                  <div className="font-medium">{r.user?.email || r.userId}</div>
                  <div className="opacity-70 text-xs">{r.user?.name || ""}</div>
                </td>
                <td className="p-3">{String(r.plan)}</td>
                <td className="p-3">{r.term || "-"}</td>
                <td className="p-3">{r.status || "-"}</td>
                <td className="p-3">{r.currentPeriodEnd ? new Date(r.currentPeriodEnd).toLocaleString() : "-"}</td>
                <td className="p-3 font-mono text-xs">{r.stripeCustomer || "-"}</td>
                <td className="p-3 font-mono text-xs">{r.stripeSubscription || "-"}</td>
                <td className="p-3">{new Date(r.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Pending claims (guest, not claimed)</h2>
      <div className="mt-4 overflow-x-auto border border-[var(--border)] rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--card)]">
            <tr className="text-left">
              <th className="p-3">Email</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Term</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Session</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((p) => (
              <tr key={p.id} className="border-t border-[var(--border)]">
                <td className="p-3">{p.email}</td>
                <td className="p-3">{String(p.plan)}</td>
                <td className="p-3">{p.term || "-"}</td>
                <td className="p-3 font-mono text-xs">{p.stripeCustomer || "-"}</td>
                <td className="p-3 font-mono text-xs">{p.stripeSessionId || "-"}</td>
                <td className="p-3">{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
