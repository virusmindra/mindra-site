// src/components/chat/ChatWindow.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, ChatFeature } from "./types";
import ReminderConfirm from "@/components/chat/ReminderConfirm";

type Props = {
  messages: ChatMessage[];
  activeFeature: ChatFeature;

  // goals
  goalSuggestion: { text: string } | null;
  onSaveGoal: (text: string) => Promise<void>;
  onMarkGoalDone?: (goalId: string) => Promise<void>;
  goalDone?: boolean;

  // reminders
  pendingReminder?: { text: string; dueUtc: string } | null;
  onConfirmReminder?: () => void;
  onCancelReminder?: () => void;
  reminderBusy?: boolean;

  // habits
  habitSuggestion?: { text: string } | null;
  onSaveHabit?: (text: string) => Promise<void>;
  onMarkHabitDone?: (habitId: string) => Promise<void>;
  habitDone?: boolean;

  // 🔊 voice UI
  playingTtsTs?: number | null;
  onToggleTts?: (ts: number, url: string) => void;

  currentSessionId?: string;
  locale: string;
};

function ui(locale: string) {
  const l = (locale || "en").toLowerCase();

  const pick = (m: Record<string, string>) => {
    if (l.startsWith("ru")) return m.ru;
    if (l.startsWith("uk")) return m.uk;
    if (l.startsWith("es")) return m.es;
    if (l.startsWith("fr")) return m.fr;
    if (l.startsWith("de")) return m.de;
    if (l.startsWith("pl")) return m.pl;
    if (l.startsWith("ro")) return m.ro;
    if (l.startsWith("kk")) return m.kk;
    if (l.startsWith("ka")) return m.ka;
    if (l.startsWith("hy")) return m.hy;
    return m.en;
  };

  return {
    saveGoal: pick({
      ru: "➕ Сохранить как цель",
      uk: "➕ Зберегти як ціль",
      en: "➕ Save as goal",
      es: "➕ Guardar como meta",
      fr: "➕ Enregistrer comme objectif",
      de: "➕ Als Ziel speichern",
      pl: "➕ Zapisz jako cel",
      ro: "➕ Salvează ca obiectiv",
      kk: "➕ Мақсат ретінде сақтау",
      ka: "➕ მიზნად შენახვა",
      hy: "➕ Պահպանել որպես նպատակ",
    }),
    saveHabit: pick({
      ru: "➕ Добавить как привычку",
      uk: "➕ Додати як звичку",
      en: "➕ Add as habit",
      es: "➕ Añadir como hábito",
      fr: "➕ Ajouter comme habitude",
      de: "➕ Als Gewohnheit hinzufügen",
      pl: "➕ Dodaj jako nawyk",
      ro: "➕ Adaugă ca obicei",
      kk: "➕ Әдет ретінде қосу",
      ka: "➕ ჩვევად დამატება",
      hy: "➕ Ավելացնել որպես սովորություն",
    }),
    doneGoal: pick({
      ru: "✅ Отметить выполненной",
      uk: "✅ Позначити виконаною",
      en: "✅ Mark done",
      es: "✅ Marcar como hecho",
      fr: "✅ Marquer comme fait",
      de: "✅ Als erledigt markieren",
      pl: "✅ Oznacz jako zrobione",
      ro: "✅ Marchează ca făcut",
      kk: "✅ Орындалды деп белгілеу",
      ka: "✅ შესრულებულად მონიშვნა",
      hy: "✅ Նշել որպես կատարված",
    }),
    doneHabit: pick({
      ru: "🔁 Отметить привычку",
      uk: "🔁 Позначити звичку",
      en: "🔁 Mark habit",
      es: "🔁 Marcar hábito",
      fr: "🔁 Valider l’habitude",
      de: "🔁 Gewohnheit markieren",
      pl: "🔁 Oznacz nawyk",
      ro: "🔁 Marchează obiceiul",
      kk: "🔁 Әдетті белгілеу",
      ka: "🔁 ჩვევის მონიშვნა",
      hy: "🔁 Նշել սովորությունը",
    }),
  };
}

export default function ChatWindow({
  messages,
  activeFeature,
  goalSuggestion,
  onSaveGoal,
  onMarkGoalDone,
  habitSuggestion = null,
  onSaveHabit,
  onMarkHabitDone,
  currentSessionId,
  locale,
  goalDone = false,
  habitDone = false,
  pendingReminder = null,
  onConfirmReminder,
  onCancelReminder,
  reminderBusy = false,

  playingTtsTs = null,
  onToggleTts,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const threshold = 120;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setStickToBottom(atBottom);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottom) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, stickToBottom]);

  const isGoalDiary = Boolean(currentSessionId?.startsWith("goal:"));
  const isHabitDiary = Boolean(currentSessionId?.startsWith("habit:"));

  const labels = useMemo(() => ui(locale), [locale]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        ref={scrollerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6"
      >
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            const isLast = idx === messages.length - 1;

            const anyMsg: any = m;

            // ✅ IMAGE MESSAGE
            if (anyMsg?.images?.length) {
              return (
                <div
                  key={m.ts}
                  className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[520px]">
                    {anyMsg?.content ? (
                      <div
                        className={[
                          "mb-2 px-4 py-2 rounded-2xl text-sm md:text-base whitespace-pre-wrap",
                          isUser
                            ? "bg-white text-zinc-900 rounded-br-sm"
                            : "bg-zinc-900 text-zinc-50 border border-white/10 rounded-bl-sm",
                        ].join(" ")}
                      >
                        {anyMsg.content}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2 justify-end">
                      {anyMsg.images.map((url: string) => (
                        <div
                          key={url}
                          className="w-[160px] rounded-2xl overflow-hidden border border-[var(--border)]"
                        >
                          <img src={url} alt="photo" className="block w-full h-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            const ttsUrl: string | null =
              typeof (m as any)?.ttsAudioUrl === "string" && (m as any).ttsAudioUrl
                ? (m as any).ttsAudioUrl
                : null;

            return (
              <div
                key={m.ts}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed max-w-[80%]",
                    "whitespace-pre-wrap",
                    isUser
                      ? "bg-white text-zinc-900 rounded-br-sm"
                      : "bg-zinc-900 text-zinc-50 border border-white/10 rounded-bl-sm",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 whitespace-pre-wrap">{m.content}</div>

                    {/* 🔊 / ⏸ (no title) */}
                    {!isUser && ttsUrl && onToggleTts ? (
                      <button
                        type="button"
                        onClick={() => onToggleTts(m.ts, ttsUrl)}
                        className="shrink-0 text-lg opacity-70 hover:opacity-100 transition"
                        aria-label="Toggle voice"
                      >
                        {playingTtsTs === m.ts ? "⏸" : "🔊"}
                      </button>
                    ) : null}
                  </div>

                  {/* Save as goal */}
                  {!isUser &&
                  isLast &&
                  activeFeature === "goals" &&
                  !isGoalDiary &&
                  !goalDone &&
                  goalSuggestion?.text ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSaveGoal(goalSuggestion.text)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition"
                      >
                        {labels.saveGoal}
                      </button>
                    </div>
                  ) : null}

                  {/* Save as habit */}
                  {!isUser &&
                  isLast &&
                  activeFeature === "habits" &&
                  !isHabitDiary &&
                  !habitDone &&
                  habitSuggestion?.text &&
                  onSaveHabit ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSaveHabit(habitSuggestion.text)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition"
                      >
                        {labels.saveHabit}
                      </button>
                    </div>
                  ) : null}

                  {/* Reminder confirm (only last assistant message in reminders tab) */}
                  {!isUser &&
                  isLast &&
                  activeFeature === "reminders" &&
                  pendingReminder &&
                  onConfirmReminder &&
                  onCancelReminder ? (
                    <ReminderConfirm
                      text={pendingReminder.text}
                      dueUtc={pendingReminder.dueUtc}
                      onYes={onConfirmReminder}
                      onNo={onCancelReminder}
                      busy={reminderBusy}
                    />
                  ) : null}

                  {/* Mark goal done (goal diary only) */}
                  {!isUser && isLast && isGoalDiary && onMarkGoalDone && !goalDone ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const goalId = String(currentSessionId).replace("goal:", "");
                          onMarkGoalDone(goalId);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                      >
                        {labels.doneGoal}
                      </button>
                    </div>
                  ) : null}

                  {/* Mark habit done (habit diary only) */}
                  {!isUser && isLast && isHabitDiary && onMarkHabitDone && !habitDone ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const habitId = String(currentSessionId).replace("habit:", "");
                          onMarkHabitDone(habitId);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                      >
                        {labels.doneHabit}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
