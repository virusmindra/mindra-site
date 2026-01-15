// src/components/pwa/AddToHomeHint.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}
function isAndroid() {
  if (typeof window === "undefined") return false;
  return /android/i.test(window.navigator.userAgent);
}
function isStandalone() {
  if (typeof window === "undefined") return false;
  // iOS Safari standalone
  // @ts-ignore
  const iosStandalone = window.navigator.standalone === true;
  // Chrome/others
  const mqStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
  return Boolean(iosStandalone || mqStandalone);
}

type Props = {
  locale?: string;
  variant?: "card" | "fullscreen";
  onClose?: () => void;
};

export default function AddToHomeHint({ locale = "en", variant = "card", onClose }: Props) {
  const l = (locale || "en").toLowerCase();
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    if (isIOS()) setPlatform("ios");
    else if (isAndroid()) setPlatform("android");
    else setPlatform("other");
  }, []);

  const t = useMemo(() => {
    const es = l.startsWith("es");
    return {
      title: es ? "Para que Mindra siempre esté contigo" : "So Mindra is always with you",
      subtitle: es
        ? "Añádelo a la pantalla de inicio — se sentirá como una app real ✨"
        : "Add to Home Screen — it will feel like a real app ✨",
      iosSteps: es
        ? ["Abre en Safari", "Compartir (⬆️)", "Añadir a pantalla de inicio"]
        : ["Open in Safari", "Share (⬆️)", "Add to Home Screen"],
      andSteps: es
        ? ["Abre en Chrome", "Menú (⋮)", "Añadir a pantalla de inicio"]
        : ["Open in Chrome", "Menu (⋮)", "Add to Home Screen"],
      other: es
        ? "Tip: usa Safari (iPhone) o Chrome (Android) para añadirlo a la pantalla de inicio."
        : "Tip: use Safari (iPhone) or Chrome (Android) to add it to your Home Screen.",
      close: es ? "Got it" : "Got it",
    };
  }, [l]);

  if (standalone) return null;

  const Body = () => (
    <div className="space-y-3">
      <div className="text-base font-semibold">{t.title}</div>
      <div className="text-sm text-[var(--muted)]">{t.subtitle}</div>

      {/* “картинка”: можно заменить на свои скрины */}
      <div className="rounded-2xl border border-[var(--border)] p-3 bg-black/10">
        <div className="text-xs text-[var(--muted)]">
          {platform === "ios" ? "iPhone / iOS" : platform === "android" ? "Android" : "Phone"}
        </div>
        <ol className="mt-2 list-decimal pl-5 text-sm space-y-1">
          {(platform === "ios" ? t.iosSteps : platform === "android" ? t.andSteps : []).map((s) => (
            <li key={s}>{s}</li>
          ))}
          {platform === "other" ? <li>{t.other}</li> : null}
        </ol>
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-white text-zinc-900 py-2 text-sm font-medium hover:bg-zinc-200 transition"
        >
          {t.close}
        </button>
      ) : null}
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] p-5 shadow-xl">
          <Body />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-4">
      <div className="rounded-3xl border border-[var(--border)] bg-black/10 p-4">
        <Body />
      </div>
    </div>
  );
}
