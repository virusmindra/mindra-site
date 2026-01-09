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

  const isEs = navigator.language.startsWith("es");

const title = isEs
  ? "¿Crear recordatorio de Mindra?"
  : "Create a reminder from Mindra?";

const yes = isEs ? "Yes ✅" : "Yes ✅";
const no = isEs ? "No" : "No";

  return (
    <div className="mt-2 rounded-2xl border bg-white/60 dark:bg-black/20 p-4">
      <div className="font-semibold">Создать напоминание от Mindra?</div>
      <div className="text-sm opacity-70 mt-1">
        <div><span className="opacity-60">Текст:</span> {text}</div>
        <div><span className="opacity-60">Когда:</span> {due.toLocaleString()}</div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
          onClick={onYes}
          disabled={busy}
        >
          Да ✅
        </button>
        <button
          className="px-4 py-2 rounded-xl border disabled:opacity-50"
          onClick={onNo}
          disabled={busy}
        >
          Нет
        </button>
      </div>
    </div>
  );
}
