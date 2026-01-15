"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

function normLocale(raw: string) {
  const l = String(raw || "en").toLowerCase();
  return l.startsWith("es") ? "es" : "en";
}

export default function FeedbackForm() {
  const router = useRouter();
  const params = useParams();
  const locale = normLocale(String((params as any)?.locale ?? "en"));

  const T = useMemo(() => {
    if (locale === "es") {
      return {
        title: "Tu opinión sobre Mindra",
        subtitle: "Nos ayuda muchísimo a mejorar 💜",
        rating: "Calificación",
        placeholder: "Escribe aquí… ¿Qué te gustó? ¿Qué mejorarías?",
        send: "Enviar",
        sending: "Enviando…",
        sentTitle: "¡Gracias! 💜",
        sentText: "Tu feedback fue enviado.",
        back: "Volver al chat",
        error: "No se pudo enviar 😕 Intenta otra vez.",
        required: "Por favor escribe unas palabras.",
      };
    }
    return {
      title: "Your feedback about Mindra",
      subtitle: "It helps us improve a lot 💜",
      rating: "Rating",
      placeholder: "Write here… What did you like? What should we improve?",
      send: "Send",
      sending: "Sending…",
      sentTitle: "Thank you! 💜",
      sentText: "Your feedback was sent.",
      back: "Back to chat",
      error: "Couldn’t send 😕 Please try again.",
      required: "Please write a few words.",
    };
  }, [locale]);

  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);

    const t = text.trim();
    if (!t) {
      setErr(T.required);
      return;
    }

    setBusy(true);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: t, locale }),
      });

      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error || `failed (${r.status})`);

      setOk(true);
    } catch (e: any) {
      setErr(T.error + (e?.message ? `\n${String(e.message)}` : ""));
    } finally {
      setBusy(false);
    }
  };

  const Star = ({ i }: { i: number }) => {
    const active = i <= rating;
    return (
      <button
        type="button"
        onClick={() => setRating(i)}
        className={[
          "w-10 h-10 rounded-xl border border-[var(--border)] grid place-items-center",
          "transition",
          active ? "bg-[var(--accent)] text-white" : "bg-[var(--card)] text-[var(--text)] hover:bg-white/5",
        ].join(" ")}
        aria-label={`rate-${i}`}
        title={`${i}`}
      >
        ★
      </button>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{T.title}</h1>
            <p className="text-sm text-[var(--muted)] mt-1">{T.subtitle}</p>
          </div>

          <button
            onClick={() => router.push(`/${locale}/chat`)}
            className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-white/5 text-sm"
          >
            {T.back}
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          {ok ? (
            <div className="text-center py-10">
              <div className="text-2xl font-semibold">{T.sentTitle}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">{T.sentText}</div>

              <button
                onClick={() => router.push(`/${locale}/chat`)}
                className="mt-6 px-5 py-3 rounded-xl bg-[var(--accent)] text-white font-medium"
              >
                {T.back}
              </button>
            </div>
          ) : (
            <>
              <div className="text-sm font-medium mb-2">{T.rating}</div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} i={i} />
                ))}
              </div>

              <div className="mt-5">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={T.placeholder}
                  rows={6}
                  className={[
                    "w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)]",
                    "px-4 py-3 text-sm outline-none",
                    "focus:ring-2 focus:ring-[var(--accent)]/50",
                  ].join(" ")}
                />
              </div>

              {err ? (
                <div className="mt-3 text-sm text-red-400 whitespace-pre-wrap">{err}</div>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  onClick={submit}
                  disabled={busy}
                  className={[
                    "px-5 py-3 rounded-xl font-medium",
                    busy ? "opacity-70 cursor-not-allowed" : "",
                    "bg-[var(--accent)] text-white",
                  ].join(" ")}
                >
                  {busy ? T.sending : T.send}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-xs text-[var(--muted)]">
          Mindra Group · feedback
        </div>
      </div>
    </div>
  );
}
