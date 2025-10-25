export default function Landing() {
  return (
    <section className="mx-auto max-w-4xl text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Mindra — your AI co-pilot</h1>
      <p className="mt-4 text-zinc-300">
        Chat with an AI assistant, manage subscriptions, and support the project — all in one place.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="./chat"
          className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:opacity-90"
        >
          Open Chat
        </a>
        <a
          href="./pricing"
          className="rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/10"
        >
          See Pricing
        </a>
        <a
          href="./donate"
          className="rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/10"
        >
          Support the project
        </a>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Feature title="Fast responses">Streaming answers with SSE.</Feature>
        <Feature title="Multi-language UI">Switch languages in the header.</Feature>
        <Feature title="Auth & Sync">Sign in to sync chats across devices.</Feature>
        <Feature title="Stripe payments">Subscriptions and one-time tips.</Feature>
      </div>
    </section>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 p-5 text-left">
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm text-zinc-300">{children}</p>
    </div>
  );
}
