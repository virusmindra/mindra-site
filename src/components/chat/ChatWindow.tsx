// src/components/chat/ChatWindow.tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { ChatMessage, ChatFeature } from './types';

type Props = {
  messages: ChatMessage[];
  activeFeature: ChatFeature;

  goalSuggestion: { text: string } | null;
  onSaveGoal: (text: string) => Promise<void>;
  onMarkGoalDone?: (goalId: string) => Promise<void>;

  habitSuggestion?: { text: string } | null;
  onSaveHabit?: (text: string) => Promise<void>;
  onMarkHabitDone?: (habitId: string) => Promise<void>;

  currentSessionId?: string;
  locale: string;
};

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

/**
 * Простая эвристика, чтобы кнопка "save" не появлялась на "привет"
 * (можно усилить на бэке, но это спасает UI прямо сейчас).
 */
function looksLikeGoalOrHabit(text: string) {
  const t = (text || '').trim().toLowerCase();
  if (!t) return false;

  // 1️⃣ слишком короткие сообщения — не намерение
  if (t.length < 8) return false;

  // 2️⃣ чистые приветствия — отсекаем
  const greetings = [
    // ru / ua
    'привет', 'здарова', 'хай', 'добрый день', 'добрый вечер',
    // en
    'hi', 'hello', 'hey', 'yo',
    // es
    'hola',
    // fr
    'bonjour', 'salut',
    // de
    'hallo',
    // pl
    'cześć',
    // ro
    'salut',
    // kk
    'сәлем',
    // ka
    'გამარჯობა',
    // hy
    'բարեւ',
  ];

  if (greetings.some((g) => t === g || t.startsWith(g + ' '))) {
    return false;
  }

  // 3️⃣ маркеры намерения (цель / привычка / план)
  const intentWords = [
    // 🇷🇺 RU
    'хочу', 'план', 'цель', 'мечта', 'начать', 'перестать',
    'привычк', 'каждый день', 'ежедневно', 'собираюсь',

    // 🇺🇦 UK
    'хочу', 'план', 'ціль', 'звичк', 'почати', 'перестати',
    'кожен день', 'щодня', 'збираюся',

    // 🇬🇧 EN
    'i want', 'i need', 'my goal', 'my plan', 'start', 'stop',
    'habit', 'goal', 'every day', 'daily', 'i am going to',

    // 🇪🇸 ES
    'quiero', 'mi objetivo', 'mi meta', 'empezar', 'dejar',
    'hábito', 'cada día', 'diario',

    // 🇫🇷 FR
    'je veux', 'mon objectif', 'mon but', 'commencer', 'arrêter',
    'habitude', 'chaque jour', 'quotidien',

    // 🇩🇪 DE
    'ich will', 'mein ziel', 'mein plan', 'anfangen', 'aufhören',
    'gewohnheit', 'jeden tag', 'täglich',

    // 🇵🇱 PL
    'chcę', 'mój cel', 'mój plan', 'zacząć', 'przestać',
    'nawyk', 'codziennie', 'każdego dnia',

    // 🇷🇴 RO
    'vreau', 'obiectivul meu', 'scopul meu', 'încep', 'renunț',
    'obicei', 'în fiecare zi', 'zilnic',

    // 🇰🇿 KK
    'қалаймын', 'мақсат', 'жоспар', 'бастау', 'тоқтату',
    'әдет', 'күнде', 'әр күн',

    // 🇬🇪 KA
    'მინდა', 'ჩემი მიზანი', 'გეგმა', 'დაწყება', 'შეწყვეტა',
    'ჩვევა', 'ყოველ დღე',

    // 🇦🇲 HY
    'ուզում եմ', 'իմ նպատակը', 'իմ ծրագիրը', 'սկսել', 'դադարեցնել',
    'սովորություն', 'ամեն օր',
  ];

  return intentWords.some((w) => t.includes(w));
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
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const labels = useMemo(() => ui(locale), [locale]);

  const isGoalDiary = Boolean(currentSessionId?.startsWith('goal:'));
  const isHabitDiary = Boolean(currentSessionId?.startsWith('habit:'));

  // Последнее user-сообщение — для фильтрации "привет"
  const lastUserText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') return String(messages[i]?.content || '');
    }
    return '';
  }, [messages]);

  const allowSuggestButton = looksLikeGoalOrHabit(lastUserText);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            const isLast = idx === messages.length - 1;

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

                  {/* Save as goal (только goals, не diary, и только если текст реально похож на намерение) */}
                  {!isUser &&
                  isLast &&
                  activeFeature === 'goals' &&
                  !isGoalDiary &&
                  allowSuggestButton &&
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

                  {/* Add as habit (только habits, не diary, и только если пришёл habitSuggestion) */}
                  {!isUser &&
                  isLast &&
                  activeFeature === 'habits' &&
                  !isHabitDiary &&
                  allowSuggestButton &&
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

                  {/* Mark goal done (только goal diary) */}
                  {!isUser && isLast && isGoalDiary && onMarkGoalDone ? (
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

                  {/* Mark habit done (только habit diary) */}
                  {!isUser && isLast && isHabitDiary && onMarkHabitDone ? (
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
