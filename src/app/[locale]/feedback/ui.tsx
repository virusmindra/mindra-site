"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function normLocale(raw: string) {
  const l = String(raw || "en").toLowerCase();
  return l.startsWith("es") ? "es" : "en";
}

export default function FeedbackClient() {
  const router = useRouter();
  const params = useParams();
  const locale = normLocale(String((params as any)?.locale ?? "en"));

  const T = useMemo(() => {
    return locale === "es"
      ? {
          title: "Reseña",
          subtitle: "Tu feedback hace a Mindra mejor 💜",
          rating: "Calificación",
          message: "Mensaje",
          placeholder: "¿Qué te gustó? ¿Qué mejorarías?",
          send: "Enviar",
          back: "Volver al chat",
          thanks: "Gracias 💜 ¡Lo recibí!",
        }
      : {
          title: "Feedback",
          subtitle: "Your feedback makes Mindra better 💜",
          rating: "Rating",
          message: "Message",
          placeholder: "What did you like? What should we improve?",
          send: "Send",
          back: "Back to chat",
          thanks: "Thanks 💜 I got it!",
        };
  }, [locale]);

  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim(), locale }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || "feedback_failed");
      setSent(true);
      setText("");
    } catch {
      alert(locale === "es" ? "Error al enviar 😕" : "Send failed 😕");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <button
          className="text-sm text-[var(--muted)] hover:underline"
          onClick={() => router.push(`/${locale}/chat`)}
        >
          ← {T.back}
        </button>

        <h1 className="mt-4 text-2xl font-semibold">{T.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{T.subtitle}</p>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">{T.rating}</div>
            <div className="flex gap-2">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={[
                    "w-10 h-10 rounded-xl border border-[var(--border)]",
                    rating >= n ? "bg-[var(--accent)] text-white" : "hover:bg-black/5 dark:hover:bg-white/10"
                  ].join(" ")}
                  title={`${n}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">{T.message}</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={T.placeholder}
              rows={6}
              className="w-full rounded-2xl border border-[var(--border)] bg-transparent p-3 outline-none"
            />
          </div>

          <button
            onClick={submit}
            disabled={busy || !text.trim()}
            className="w-full h-12 rounded-2xl bg-[var(--accent)] text-white disabled:opacity-50"
          >
            {busy ? "…" : T.send}
          </button>

          {sent ? (
            <div className="text-sm text-[var(--muted)]">{T.thanks}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
