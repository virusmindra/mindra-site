'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/components/theme/ThemeProvider';
import QuietHoursCard from '@/app/[locale]/(chat)/chat/_components/QuietHoursCard';
import PointsPanel from '@/components/chat/PointsPanel';
import { useEffect, useState } from "react";

function normLocale(raw: string) {
  const l = String(raw || 'en').toLowerCase();
  return l.startsWith('es') ? 'es' : 'en';
}

export default function SettingsPanel({
  premiumVoiceEnabled,
  onTogglePremiumVoice,
  voiceNotice,
}: {
  premiumVoiceEnabled: boolean;
  onTogglePremiumVoice: (v: boolean) => void;
  voiceNotice?: string | null;
}) {
  const router = useRouter();
  const params = useParams();
  const locale = normLocale(String((params as any)?.locale ?? 'en'));

  const VOICE_KEY = "mindra_premium_voice";
  const CALL_STYLE_KEY = "mindra_call_style";

  const [me, setMe] = useState<any>(null);
  const [callStyle, setCallStyle] = useState<"carnaval" | "winter">("carnaval");

  // --- helpers (inside component, чтобы видеть me) ---
  const openPortal = async () => {
    const r = await fetch("/api/portal", { method: "POST" });
    const j = await r.json().catch(() => null);
    if (j?.url) location.href = j.url;
  };

  const cancelSubscription = async () => {
    if (!me?.authed) return;
    const ok = confirm("Are you sure you want to cancel the subscription?");
    if (!ok) return;
    await openPortal(); // cancel внутри Stripe portal
  };

  const setCallStyleAndPersist = (v: "winter" | "carnaval") => {
    setCallStyle(v);
    try {
      localStorage.setItem(CALL_STYLE_KEY, v);
      window.dispatchEvent(new Event("mindra_call_style_changed"));
    } catch {}
  };

  // --- load /api/me once ---
  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(j => {
        setMe(j);

        // автогейт: если сервер говорит "tts=false" или минут нет — выключаем
        if (j?.authed) {
          const left = Number(j?.voiceSecondsLeft ?? 0);
          if (!j?.tts || left <= 0) {
            onTogglePremiumVoice(false);
            try { localStorage.setItem(VOICE_KEY, "0"); } catch {}
          }
        }
      })
      .catch(() => setMe(null));
  }, [onTogglePremiumVoice]);

  // --- call style init ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem(CALL_STYLE_KEY);
    if (v === "carnaval" || v === "winter") {
      setCallStyle(v);
    } else {
      setCallStyle("carnaval");
      localStorage.setItem(CALL_STYLE_KEY, "carnaval");
    }
  }, []);

  const { theme, setTheme } = useTheme();

  const T =
    locale === "es"
      ? {
          title: "Ajustes",
          subtitle: "Idioma, tema, notificaciones y puntos.",
          language: "Idioma",
          english: "English",
          spanish: "Español",
          theme: "Tema",
          light: "Light",
          dark: "Dark",
          points: "Puntos y títulos",
          premiumVoice: "Premium voice",
          premiumVoiceHint: "Respuestas de voz (ElevenLabs). Requiere iniciar sesión.",
          on: "On",
          off: "Off",
          callStyle: "Estilo de llamada",
          callStyleHint: "Aspecto del avatar para llamadas.",
          mask: "Máscara",
          outdoor: "Exterior",
        }
      : {
          title: "Settings",
          subtitle: "Language, theme, notifications, and points.",
          language: "Language",
          english: "English",
          spanish: "Español",
          theme: "Theme",
          light: "Light",
          dark: "Dark",
          points: "Points & titles",
          premiumVoice: "Premium voice",
          premiumVoiceHint: "Voice replies (ElevenLabs). Requires sign-in.",
          on: "On",
          off: "Off",
          callStyle: "Call style",
          callStyleHint: "Avatar look for Face-to-Face calls.",
          mask: "Mask",
          outdoor: "Outdoor",
        };

  const uid =
    typeof window === "undefined"
      ? "web"
      : localStorage.getItem("mindra_uid") || "web";


return (
  <div className="p-6 max-w-3xl">
    <h1 className="text-xl font-semibold text-[var(--text)]">{T.title}</h1>
    <p className="text-sm text-[var(--muted)] mt-1">{T.subtitle}</p>

    <div className="mt-6 space-y-4">
      {/* SUBSCRIPTION */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-[var(--text)]">Subscription</div>
            <div className="text-xs text-[var(--muted)]">
              {me?.authed
                ? `Plan: ${me.plan ?? "FREE"} · Status: ${me.status ?? "unknown"}`
                : "Sign in to manage"}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={openPortal}
              className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm hover:bg-black/5 dark:hover:bg-white/10"
              disabled={!me?.authed}
            >
              Manage
            </button>

            <button
              onClick={cancelSubscription}
              className="px-3 py-2 rounded-xl border border-red-500/40 text-sm text-red-500 hover:bg-red-500/10"
              disabled={!me?.authed}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* PREMIUM VOICE */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-[var(--text)]">{T.premiumVoice}</div>
            <div className="text-xs text-[var(--muted)]">{T.premiumVoiceHint}</div>

            {voiceNotice ? (
              <div className="mt-2 text-xs text-[var(--muted)]">{voiceNotice}</div>
            ) : null}

            {me?.authed ? (
              <div className="mt-2 text-xs text-[var(--muted)]">
                {Math.floor((me.voiceSecondsUsed ?? 0) / 60)} min used ·{" "}
                {Math.floor((me.voiceSecondsLeft ?? 0) / 60)} min left
              </div>
            ) : null}
          </div>

          <div className="inline-flex rounded-full bg-[var(--card)] border border-[var(--border)] p-1 text-[11px]">
            <button
              onClick={() => onTogglePremiumVoice(false)}
              className={[
                "px-2 py-0.5 rounded-full transition",
                !premiumVoiceEnabled
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              {T.off}
            </button>

            <button
              onClick={() => onTogglePremiumVoice(true)}
              className={[
                "px-2 py-0.5 rounded-full transition",
                premiumVoiceEnabled
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              {T.on}
            </button>
          </div>
        </div>
      </div>

      {/* CALL STYLE */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-[var(--text)]">{T.callStyle}</div>
            <div className="text-xs text-[var(--muted)]">{T.callStyleHint}</div>
          </div>

          <div className="inline-flex rounded-full bg-[var(--card)] border border-[var(--border)] p-1 text-[11px]">
            <button
              onClick={() => setCallStyleAndPersist("carnaval")}
              className={[
                "px-2 py-0.5 rounded-full transition",
                callStyle === "carnaval"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              🎭 {T.mask}
            </button>

            <button
              onClick={() => setCallStyleAndPersist("winter")}
              className={[
                "px-2 py-0.5 rounded-full transition",
                callStyle === "winter"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              ❄️ {T.outdoor}
            </button>
          </div>
        </div>
      </div>

      {/* LANGUAGE */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-[var(--text)]">{T.language}</div>
            <div className="text-xs text-[var(--muted)]">EN / ES</div>
          </div>

          <div className="inline-flex rounded-full bg-[var(--card)] border border-[var(--border)] p-1 text-[11px]">
            <button
              onClick={() => router.push(`/en/chat`)}
              className={[
                "px-2 py-0.5 rounded-full transition",
                locale === "en"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              {T.english}
            </button>

            <button
              onClick={() => router.push(`/es/chat`)}
              className={[
                "px-2 py-0.5 rounded-full transition",
                locale === "es"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              {T.spanish}
            </button>
          </div>
        </div>
      </div>

      {/* THEME */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[var(--text)]">{T.theme}</div>
            <div className="text-xs text-[var(--muted)]">Light / Dark</div>
          </div>

          <div className="inline-flex rounded-full bg-[var(--card)] border border-[var(--border)] p-1 text-[11px]">
            <button
              onClick={() => setTheme("light")}
              className={[
                "px-2 py-0.5 rounded-full transition",
                theme === "light"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              ☀️ {T.light}
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={[
                "px-2 py-0.5 rounded-full transition",
                theme === "dark"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10",
              ].join(" ")}
            >
              🌙 {T.dark}
            </button>
          </div>
        </div>
      </div>

      {/* QUIET HOURS + PUSH SETTINGS */}
      <QuietHoursCard />

      {/* POINTS INSIDE SETTINGS */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="text-sm font-medium text-[var(--text)] mb-2">{T.points}</div>
        <PointsPanel uid={uid} locale={locale} />
      </div>

      {/* FEEDBACK */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-[var(--text)]">Feedback</div>
            <div className="text-xs text-[var(--muted)]">Leave a review — we’ll build a full page next</div>
          </div>

          <button
            onClick={() => alert("Thanks 💜 Feedback page is coming next!")}
            className="w-12 h-12 rounded-full bg-[var(--accent)] text-white text-lg"
            title="Leave feedback"
          >
            💜
          </button>
        </div>
      </div>
    </div>
  </div>
);
}