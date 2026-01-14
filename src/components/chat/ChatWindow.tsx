// src/components/chat/ChatWindow.tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ChatMessage, ChatFeature } from './types';
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

  currentSessionId?: string;
  locale: string;
};

const intentWords = [
  // RU
  'хочу', 'надо', 'нужно', 'план', 'цель', 'мечта', 'решил', 'начать', 'перестать',
  'привычк', 'каждый день', 'ежедневно', 'регулярно',

  // UK
  'хочу', 'треба', 'потрібно', 'план', 'ціль', 'мрія', 'вирішив', 'почати', 'перестати',
  'звичк', 'щодня', 'кожен день', 'регулярно',

  // EN
  'i want', 'i need', 'plan', 'goal', 'dream', 'decided', 'start', 'stop',
  'habit', 'every day', 'daily', 'regularly',

  // ES
  'quiero', 'necesito', 'plan', 'meta', 'objetivo', 'sueño', 'empezar', 'dejar',
  'hábito', 'cada día', 'diario', 'regularmente',

  // FR
  'je veux', 'j’ai besoin', 'plan', 'objectif', 'rêve', 'commencer', 'arrêter',
  'habitude', 'chaque jour', 'quotidien', 'régulièrement',

  // DE
  'ich will', 'ich muss', 'brauche', 'plan', 'ziel', 'traum', 'anfangen', 'aufhören',
  'gewohnheit', 'jeden tag', 'täglich', 'regelmäßig',

  // PL
  'chcę', 'muszę', 'potrzebuję', 'plan', 'cel', 'marzenie', 'zacząć', 'przestać',
  'nawyk', 'codziennie', 'każdego dnia', 'regularnie',

  // RO
  'vreau', 'trebuie', 'am nevoie', 'plan', 'scop', 'vis', 'încep', 'renunț',
  'obicei', 'în fiecare zi', 'zilnic', 'regulat',

  // KK
  'қалаймын', 'керек', 'қажет', 'жоспар', 'мақсат', 'арман', 'бастау', 'тоқтату',
  'әдет', 'күнде', 'әр күні', 'күн сайын', 'тұрақты',

  // KA
  'მინდა', 'მჭირდება', 'გეგმა', 'მიზანი', 'ოცნება', 'დავიწყო', 'შევწყვიტო',
  'ჩვევა', 'ყოველ დღე', 'ყოველდღე', 'რეგულარულად',

  // HY
  'ուզում եմ', 'պետք է', 'կարիք ունեմ', 'պլան', 'նպատակ', 'երազանք', 'սկսել', 'դադարեցնել',
  'սովորություն', 'ամեն օր', 'ամենօրյա', 'կանոնավոր',
];

function ui(locale: string) {
  const l = (locale || 'en').toLowerCase();

  const pick = (m: Record<string, string>) => {
    if (l.startsWith('ru')) return m.ru;
    if (l.startsWith('uk')) return m.uk;
    if (l.startsWith('es')) return m.es;
    if (l.startsWith('fr')) return m.fr;
    if (l.startsWith('de')) return m.de;
    if (l.startsWith('pl')) return m.pl;
    if (l.startsWith('ro')) return m.ro;
    if (l.startsWith('kk')) return m.kk;
    if (l.startsWith('ka')) return m.ka;
    if (l.startsWith('hy')) return m.hy;
    return m.en;
  };

  return {
    saveGoal: pick({
      ru: '➕ Сохранить как цель',
      uk: '➕ Зберегти як ціль',
      en: '➕ Save as goal',
      es: '➕ Guardar como meta',
      fr: '➕ Enregistrer comme objectif',
      de: '➕ Als Ziel speichern',
      pl: '➕ Zapisz jako cel',
      ro: '➕ Salvează ca obiectiv',
      kk: '➕ Мақсат ретінде сақтау',
      ka: '➕ მიზნად შენახვა',
      hy: '➕ Պահպանել որպես նպատակ',
    }),
    saveHabit: pick({
      ru: '➕ Добавить как привычку',
      uk: '➕ Додати як звичку',
      en: '➕ Add as habit',
      es: '➕ Añadir como hábito',
      fr: '➕ Ajouter comme habitude',
      de: '➕ Als Gewohnheit hinzufügen',
      pl: '➕ Dodaj jako nawyk',
      ro: '➕ Adaugă ca obicei',
      kk: '➕ Әдет ретінде қосу',
      ka: '➕ ჩვევად დამატება',
      hy: '➕ Ավելացնել որպես սովորություն',
    }),
    doneGoal: pick({
      ru: '✅ Отметить выполненной',
      uk: '✅ Позначити виконаною',
      en: '✅ Mark done',
      es: '✅ Marcar como hecho',
      fr: '✅ Marquer comme fait',
      de: '✅ Als erledigt markieren',
      pl: '✅ Oznacz jako zrobione',
      ro: '✅ Marchează ca făcut',
      kk: '✅ Орындалды деп белгілеу',
      ka: '✅ შესრულებულად მონიშვნა',
      hy: '✅ Նշել որպես կատարված',
    }),
    doneHabit: pick({
      ru: '🔁 Отметить привычку',
      uk: '🔁 Позначити звичку',
      en: '🔁 Mark habit',
      es: '🔁 Marcar hábito',
      fr: '🔁 Valider l’habitude',
      de: '🔁 Gewohnheit markieren',
      pl: '🔁 Oznacz nawyk',
      ro: '🔁 Marchează obiceiul',
      kk: '🔁 Әдетті белгілеу',
      ka: '🔁 ჩვევის მონიშვნა',
      hy: '🔁 Նշել սովորությունը',
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

}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const isGoalDiary = Boolean(currentSessionId?.startsWith('goal:'));
  const isHabitDiary = Boolean(currentSessionId?.startsWith('habit:'));

  const labels = useMemo(() => ui(locale), [locale]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {messages.map((m, idx) => {
  const isUser = m.role === 'user';
  const isLast = idx === messages.length - 1;

  // ✅ IMAGE MESSAGE (render instead of text bubble)
  const anyMsg: any = m;

if (anyMsg?.images?.length) {
  const isUser = m.role === "user";
  return (
    <div key={m.ts} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[520px]">
        {anyMsg?.content ? (
          <div className={[
            "mb-2 px-4 py-2 rounded-2xl text-sm md:text-base whitespace-pre-wrap",
            isUser ? "bg-white text-zinc-900 rounded-br-sm" : "bg-zinc-900 text-zinc-50 border border-white/10 rounded-bl-sm",
          ].join(" ")}>
            {anyMsg.content}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 justify-end">
          {anyMsg.images.map((url: string) => (
            <div key={url} className="w-[160px] rounded-2xl overflow-hidden border border-[var(--border)]">
              <img src={url} alt="photo" className="block w-full h-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

  return (
    <div
      key={m.ts}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={[
          'px-4 py-2 rounded-2xl text-sm md:text-base leading-relaxed max-w-[80%]',
          'whitespace-pre-wrap',
          isUser
            ? 'bg-white text-zinc-900 rounded-br-sm'
            : 'bg-zinc-900 text-zinc-50 border border-white/10 rounded-bl-sm',
        ].join(' ')}
      >
        {m.content}

                  {/* Save as goal */}
                  {!isUser &&
                  isLast &&
                  activeFeature === 'goals' &&
                  !isGoalDiary &&
                  !goalDone && // ✅ важно: не показывать если уже done
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
                  activeFeature === 'habits' &&
                  !isHabitDiary &&
                  !habitDone && // ✅ важно: не показывать если уже done
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
                          const goalId = String(currentSessionId).replace('goal:', '');
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
                          const habitId = String(currentSessionId).replace('habit:', '');
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
