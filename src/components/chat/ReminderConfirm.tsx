"use client";

export default function ReminderConfirm({
  text,
  dueUtc,
  onYes,
  onNo,
  busy,
}: {
  text: string;
  dueUtc: string; // ISO
  onYes: () => void;
  onNo: () => void;
  busy?: boolean;
}) {
  const due = new Date(dueUtc);

  // язык страницы (en | es), fallback en
  const lang =
    typeof document !== "undefined"
      ? document.documentElement.lang?.startsWith("es")
        ? "es"
        : "en"
      : "en";

  const t =
    lang === "es"
      ? {
          title: "¿Crear un recordatorio de Mindra?",
          text: "Texto",
          when: "Cuándo",
          yes: "Sí ✅",
          no: "No",
        }
      : {
          title: "Create a reminder from Mindra?",
          text: "Text",
          when: "When",
          yes: "Yes ✅",
          no: "No",
        };

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-[#1c1c1f] p-4 text-white shadow-lg">
      <div className="font-semibold text-base">{t.title}</div>

      <div className="text-sm text-white/70 mt-2 space-y-1">
        <div>
          <span className="text-white/40">{t.text}:</span> {text}
        </div>
        <div>
          <span className="text-white/40">{t.when}:</span>{" "}
          {due.toLocaleString(lang)}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onYes}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {t.yes}
        </button>

        <button
          onClick={onNo}
          disabled={busy}
          className="px-4 py-2 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 disabled:opacity-50 transition"
        >
          {t.no}
        </button>
      </div>
    </div>
  );
}
