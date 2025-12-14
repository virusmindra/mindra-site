'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatSession, ChatMessage, ChatFeature } from '@/components/chat/types';
import { loadSessions, saveSessions, newSessionTitle } from '@/components/chat/storage';

/* ----------------------------- helpers ----------------------------- */

function getOrCreateWebUid() {
  if (typeof window === 'undefined') return 'web';
  const key = 'mindra_uid';
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = `web_${crypto?.randomUUID?.() ?? String(Date.now())}`;
    localStorage.setItem(key, uid);
  }
  return uid;
}

function createEmptySession(feature: ChatFeature = 'default'): ChatSession {
  const now = Date.now();
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(now);

  return {
    id,
    title: 'New chat',
    messages: [],
    createdAt: now,
    updatedAt: now,
    feature,
  };
}

type GoalCategory = 'gym' | 'read' | 'sleep' | 'money' | 'diet' | 'work' | 'default';
type Lang = 'en' | 'ru' | 'uk' | 'ka' | 'hy' | 'ro' | 'es' | 'fr' | 'de' | 'kk' | 'pl';

function resolveLang(locale?: string): Lang {
  const l = (locale || 'en').toLowerCase();
  if (l.startsWith('ru')) return 'ru';
  if (l.startsWith('uk')) return 'uk';
  if (l.startsWith('ka')) return 'ka';
  if (l.startsWith('hy')) return 'hy';
  if (l.startsWith('ro')) return 'ro';
  if (l.startsWith('es')) return 'es';
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('de')) return 'de';
  if (l.startsWith('kk')) return 'kk';
  if (l.startsWith('pl')) return 'pl';
  return 'en';
}

function getLocaleFromPath(): string {
  if (typeof window === 'undefined') return 'en';
  const seg = window.location.pathname.split('/').filter(Boolean)[0];
  return seg || 'en';
}

function detectGoalCategory(goalText: string): GoalCategory {
  const t = goalText.trim().toLowerCase();
  const has = (arr: string[]) => arr.some((k) => t.includes(k));

  const isGym = has(['зал', 'трен', 'gym', 'workout', 'cardio', 'fitness', 'lifting', 'weights']);
  const isRead = has(['книг', 'читать', 'reading', 'read', 'book', 'kindle']);
  const isSleep = has(['сон', 'спать', 'sleep', 'bedtime', 'wake', 'insomnia']);
  const isMoney = has(['деньг', 'доход', 'сэконом', 'budget', 'money', 'save', 'income']);
  const isDiet = has(['пит', 'еда', 'диет', 'nutrition', 'diet', 'protein', 'calorie']);
  const isWork = has(['работ', 'учёб', 'проект', 'career', 'study', 'job', 'work']);

  if (isGym) return 'gym';
  if (isRead) return 'read';
  if (isSleep) return 'sleep';
  if (isMoney) return 'money';
  if (isDiet) return 'diet';
  if (isWork) return 'work';
  return 'default';
}

// ✅ Partial — у языков может быть только default
const GOAL_TEMPLATES: Record<Lang, Partial<Record<GoalCategory, (t: string) => string>>> = {
  en: {
    gym: (t) => `Nice! ✅ I saved your goal: "${t}".

Let’s make it realistic and easy.

Quick start:
1) Pick days & time (2–3x/week).
2) Prep once (clothes + water).
3) First workout = short & simple.

When do you prefer training — morning, afternoon, or evening? 🙂`,

    read: (t) => `Nice! ✅ Goal saved: "${t}".

Let’s make reading effortless.
• 10 minutes minimum
• Tie it to a habit (coffee / bed)
• Keep the book always nearby

What do you want to read first? 📚`,

    sleep: (t) => `Nice! ✅ Goal saved: "${t}".

Better sleep starts simple:
• Fixed wake-up time
• No screens 60 min before bed
• Short wind-down ritual

What time do you want to wake up ideally? 🌙`,

    money: (t) => `Nice! ✅ Goal saved: "${t}".

Let’s make it measurable:
• Choose a number
• Pick one lever (earn or save)
• Track for 7 days

Is this about earning more or spending less? 💸`,

    diet: (t) => `Nice! ✅ Goal saved: "${t}".

Keep nutrition simple:
• Protein + veggies
• Water nearby
• Fast healthy backup

What’s the hardest part for you right now? 🥗`,

    work: (t) => `Nice! ✅ Goal saved: "${t}".

Steady progress plan:
• 20 min/day or 3×/week
• One clear focus
• Weekly visible result

Which rhythm fits you better? 🚀`,

    default: (t) => `Nice! ✅ Goal saved: "${t}".

Let’s clarify it:
• What’s the weekly minimum?
• When exactly will you do it?
• What’s plan B if something blocks you?

Want me to break it into steps? 🙂`,
  },

  ru: {
    gym: (t) => `Круто! ✅ Я сохранила цель: "${t}".

Давай сделаем её удобной.
• 2–3 тренировки в неделю
• Подготовка заранее
• Первый старт — короткий

Когда тебе удобнее заниматься — утром, днём или вечером? 🙂`,

    read: (t) => `Круто! ✅ Цель сохранена: "${t}".

Чтение без перегруза:
• 10 минут — это уже успех
• Привяжем к привычке
• Книга всегда под рукой

Что хочешь читать первым? 📚`,

    sleep: (t) => `Круто! ✅ Цель сохранена: "${t}".

Сон улучшаем мягко:
• Фиксируем подъём
• Без экрана перед сном
• Короткий ритуал

Во сколько хочешь просыпаться? 🌙`,

    money: (t) => `Круто! ✅ Цель сохранена: "${t}".

Фокус:
• Конкретная сумма
• Один финансовый рычаг
• 7 дней трекинга

Это больше про доход или экономию? 💸`,

    diet: (t) => `Круто! ✅ Цель сохранена: "${t}".

Просто и устойчиво:
• Белок + овощи
• Вода рядом
• План Б вместо фастфуда

Что сложнее всего сейчас? 🥗`,

    work: (t) => `Круто! ✅ Цель сохранена: "${t}".

Двигаемся стабильно:
• Мини-слот по времени
• Один фокус
• Видимый результат раз в неделю

Какой формат удобнее? 🚀`,

    default: (t) => `Круто! ✅ Цель сохранена: "${t}".

Уточним:
• Минимум на неделю
• Конкретное время
• План Б

Хочешь, разложу на шаги? 🙂`,
  },

  uk: { default: (t) => `Чудово! ✅ Я зберегла ціль: "${t}".\n\nХочеш, допоможу розбити на кроки? 🙂` },
  ka: { default: (t) => `შესანიშნავია! ✅ მიზანი შენახულია: "${t}".\n\nგინდა ნაბიჯებად დავყოთ? 🙂` },
  hy: { default: (t) => `Հիանալի է։ ✅ Նպատակը պահպանված է՝ "${t}".\n\nՑանկանու՞մ ես բաժանել քայլերի։ 🙂` },
  ro: { default: (t) => `Super! ✅ Scop salvat: "${t}".\n\nVrei să-l împărțim în pași? 🙂` },
  es: { default: (t) => `¡Genial! ✅ Objetivo guardado: "${t}".\n\n¿Quieres dividirlo en pasos? 🙂` },
  fr: { default: (t) => `Parfait. ✅ Objectif enregistré : "${t}".\n\nTu veux que je le découpe en étapes ?` },
  de: { default: (t) => `Sehr gut. ✅ Ziel gespeichert: "${t}".\n\nSoll ich es in Schritte aufteilen?` },
  kk: { default: (t) => `Тамаша! ✅ Мақсат сақталды: "${t}".\n\nҚадамдарға бөліп берейін бе? 🙂` },
  pl: { default: (t) => `Świetnie! ✅ Cel zapisany: "${t}".\n\nChcesz podzielić cel na kroki? 🙂` },
};

function buildSavedGoalCoachMessage(goalText: string, locale?: string) {
  const lang = resolveLang(locale);
  const category = detectGoalCategory(goalText);

  const pack = GOAL_TEMPLATES[lang];
  const fromLang = pack[category] || pack.default;

  const fromEn = GOAL_TEMPLATES.en[category] || GOAL_TEMPLATES.en.default;

  const fn = fromLang || fromEn || ((t: string) => `Nice! ✅ Goal saved: "${t}".`);
  return fn(goalText.trim());
}

function buildGoalDoneMessage(locale: string, points: number) {
  const lang = (locale || 'en').toLowerCase();

  const pick = (m: Record<string, string>) => {
    if (lang.startsWith('ru')) return m.ru;
    if (lang.startsWith('uk')) return m.uk;
    if (lang.startsWith('ka')) return m.ka;
    if (lang.startsWith('hy')) return m.hy;
    if (lang.startsWith('kk')) return m.kk;
    if (lang.startsWith('ro')) return m.ro;
    if (lang.startsWith('pl')) return m.pl;
    if (lang.startsWith('de')) return m.de;
    if (lang.startsWith('fr')) return m.fr;
    if (lang.startsWith('es')) return m.es;
    return m.en;
  };

  return pick({
    ru: `Готово ✅ Цель отмечена выполненной! +5 очков. Теперь у тебя: ${points} ⭐`,
    uk: `Готово ✅ Ціль виконано! +5 очок. Тепер у тебе: ${points} ⭐`,
    ka: `მზადაა ✅ მიზანი შესრულებულია! +5 ქულა. ახლა გაქვს: ${points} ⭐`,
    hy: `Պատրաստ է ✅ Նպատակը կատարված է։ +5 միավոր։ Հիմա ունես՝ ${points} ⭐`,
    kk: `Дайын ✅ Мақсат орындалды! +5 ұпай. Қазір сенде: ${points} ⭐`,
    ro: `Gata ✅ Obiectiv îndeplinit! +5 puncte. Acum ai: ${points} ⭐`,
    pl: `Gotowe ✅ Cel ukończony! +5 punktów. Masz teraz: ${points} ⭐`,
    de: `Erledigt ✅ Ziel abgeschlossen! +5 Punkte. Jetzt hast du: ${points} ⭐`,
    fr: `C’est fait ✅ Objectif validé ! +5 points. Tu as maintenant : ${points} ⭐`,
    es: `Hecho ✅ ¡Objetivo completado! +5 puntos. Ahora tienes: ${points} ⭐`,
    en: `Done ✅ Goal marked as completed! +5 points. You now have: ${points} ⭐`,
  });
}

/* ----------------------------- component ----------------------------- */

export default function ClientPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [activeFeature, setActiveFeature] = useState<ChatFeature>('default');

  const [lastGoalSuggestion, setLastGoalSuggestion] = useState<{ text: string } | null>(null);

  useEffect(() => {
    const stored = loadSessions();
    if (stored.length > 0) {
      setSessions(stored);
      setCurrentId(stored[0].id);
      setActiveFeature(stored[0].feature ?? 'default');
    } else {
      const first = createEmptySession();
      setSessions([first]);
      setCurrentId(first.id);
      setActiveFeature(first.feature ?? 'default');
    }
  }, []);

  useEffect(() => {
    if (sessions.length) saveSessions(sessions);
  }, [sessions]);

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId),
    [sessions, currentId],
  );

  const updateCurrentSession = (updater: (prev: ChatSession) => ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === currentId ? updater(s) : s)));
  };

  const handleSelectSession = (id: string) => {
    setCurrentId(id);
    const found = sessions.find((s) => s.id === id);
    if (found) setActiveFeature(found.feature ?? 'default');
    setLastGoalSuggestion(null);
  };

  const handleNewChat = () => {
    const fresh = createEmptySession(activeFeature);
    setSessions((prev) => [fresh, ...prev]);
    setCurrentId(fresh.id);
    setLastGoalSuggestion(null);
  };

  const handleChangeFeature = (feature: ChatFeature) => {
    setActiveFeature(feature);
    setLastGoalSuggestion(null);

    setSessions((prev) => {
      const existing = prev.find((s) => (s.feature ?? 'default') === feature);
      if (existing) {
        setCurrentId(existing.id);
        return prev;
      }

      const fresh = createEmptySession(feature);
      setCurrentId(fresh.id);
      return [fresh, ...prev];
    });
  };

  const markGoalDone = async (goalId: string) => {
  try {
    const uid = getOrCreateWebUid();

    const res = await fetch(
      `/api/goals/${encodeURIComponent(goalId)}/done?user_id=${encodeURIComponent(uid)}`,
      { method: 'POST' },
    );

    const data = await res.json().catch(() => null);

    if (!data?.ok) {
      updateCurrentSession((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: 'assistant',
            content: 'Не получилось отметить цель 😕 (ошибка API). Проверь /api/goals/*/done route.',
            ts: Date.now(),
          },
        ],
        updatedAt: Date.now(),
      }));
      return;
    }

    const locale = getLocaleFromPath();

    updateCurrentSession((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          role: 'assistant',
          content: buildGoalDoneMessage(locale, Number(data.points ?? 0)),
          ts: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    }));
  } catch {
    updateCurrentSession((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          role: 'assistant',
          content: 'Ошибка сети 😕 Попробуй ещё раз.',
          ts: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    }));
  }
};


  const saveAsGoal = async (goalText: string) => {
    try {
      const uid = getOrCreateWebUid();

      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: goalText, user_id: uid }),
      });

      const data = await res.json().catch(() => null);
      const goalId = data?.id ? String(data.id) : undefined;

      // авто-привычка для зала
      const lower = goalText.toLowerCase();
      if (lower.includes('зал') || lower.includes('трен') || lower.includes('gym') || lower.includes('workout')) {
        await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Тренировка',
            cadence: 'weekly',
            targetPerWeek: 3,
            user_id: uid, // если habits API не принимает user_id — можешь убрать
          }),
        }).catch(() => {});
      }

      if (goalId) {
        const diaryId = `goal:${goalId}`;
        const now = Date.now();

        const locale = getLocaleFromPath();
        const firstCoach = buildSavedGoalCoachMessage(goalText, locale);

        setSessions((prev) => {
          if (prev.some((s) => s.id === diaryId)) return prev;

          const diary: ChatSession = {
            id: diaryId,
            title: goalText.length > 40 ? goalText.slice(0, 40) + '…' : goalText,
            messages: [
              {
                role: 'assistant',
                content: firstCoach,
                ts: now + 1,
              },
            ],
            createdAt: now,
            updatedAt: now,
            feature: 'goals',
            goalId,
          } as any;

          return [diary, ...prev];
        });

        setActiveFeature('goals');
        setCurrentId(diaryId);
      }
    } finally {
      setLastGoalSuggestion(null);
    }
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!current) {
      const fresh = createEmptySession(activeFeature);
      setSessions([fresh]);
      setCurrentId(fresh.id);
      setLastGoalSuggestion(null);
      return;
    }

    const uid = getOrCreateWebUid();
    const isGoalDiary = Boolean(current.id?.startsWith('goal:'));

    setLastGoalSuggestion(null);

    const ts = Date.now();
    const userMsg: ChatMessage = { role: 'user', content: trimmed, ts };

    updateCurrentSession((prev) => ({
      ...prev,
      feature: prev.feature ?? activeFeature,
      messages: [...prev.messages, userMsg],
      title: prev.title === 'New chat' ? newSessionTitle([...prev.messages, userMsg]) : prev.title,
      updatedAt: Date.now(),
    }));

    setSending(true);

    try {
      const res = await fetch('/api/web-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: trimmed,
          sessionId: current.id,
          feature: activeFeature,
          user_id: uid,
        }),
      });

      let replyText = 'Извини, сервер сейчас недоступен.';
      let suggestion: { text: string } | null = null;

      try {
        const data = await res.json();

        if (data?.reply && typeof data.reply === 'string' && data.reply.trim()) {
          replyText = data.reply.trim();
        }

        if (!isGoalDiary && activeFeature === 'goals' && data?.goal_suggestion?.text) {
          suggestion = { text: String(data.goal_suggestion.text) };
        } else {
          suggestion = null;
        }
      } catch {
        // ignore parse errors
      }

      setLastGoalSuggestion(suggestion);

      const botMsg: ChatMessage = { role: 'assistant', content: replyText, ts: Date.now() };

      updateCurrentSession((prev) => ({
        ...prev,
        feature: prev.feature ?? activeFeature,
        messages: [...prev.messages, botMsg],
        updatedAt: Date.now(),
      }));
    } catch {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: 'Ошибка сервера, попробуй ещё раз чуть позже 🙏',
        ts: Date.now(),
      };

      updateCurrentSession((prev) => ({
        ...prev,
        feature: prev.feature ?? activeFeature,
        messages: [...prev.messages, errMsg],
        updatedAt: Date.now(),
      }));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] bg-zinc-950">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNewChat={handleNewChat}
        onSelect={handleSelectSession}
        activeFeature={activeFeature}
        onChangeFeature={handleChangeFeature}
      />

      <main className="flex-1 flex flex-col">
        <ChatWindow
  messages={current ? current.messages : []}
  activeFeature={activeFeature}
  goalSuggestion={lastGoalSuggestion}
  onSaveGoal={saveAsGoal}
  onMarkGoalDone={markGoalDone}     // ✅ ВАЖНО
  currentSessionId={current?.id}    // ✅ ВАЖНО
/>
        <Composer onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}
