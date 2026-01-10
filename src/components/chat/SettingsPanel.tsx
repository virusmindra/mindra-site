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

const [premiumVoice, setPremiumVoice] = useState(false);

useEffect(() => {
  if (typeof window === "undefined") return;
  setPremiumVoice(localStorage.getItem(VOICE_KEY) === "1");
}, []);

const togglePremiumVoice = (v: boolean) => {
  setPremiumVoice(v);
  try {
    localStorage.setItem(VOICE_KEY, v ? "1" : "0");
    // скажем ClientPage, что настройка изменилась
    window.dispatchEvent(new Event("mindra_premium_voice_changed"));
  } catch {}
};

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
        {/* PREMIUM VOICE */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[var(--text)]">{T.premiumVoice}</div>
              <div className="text-xs text-[var(--muted)]">{T.premiumVoiceHint}</div>

              {voiceNotice ? (
                <div className="mt-2 text-xs text-[var(--muted)]">{voiceNotice}</div>
              ) : null}
            </div>

            {/* segmented like Language/Theme */}
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
      </div>
    </div>
  );
}