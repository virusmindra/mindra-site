'use client';

import { useEffect, useMemo, useState, useRef} from 'react';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import Composer from '@/components/chat/Composer';
import type { ChatSession, ChatMessage, ChatFeature } from '@/components/chat/types';
import { loadSessions, saveSessions, newSessionTitle } from '@/components/chat/storage';
import { getTotalPoints, addPoints } from '@/lib/points';
import SettingsPanel from "@/components/chat/SettingsPanel";
import ReminderConfirm from "../../../../components/chat/ReminderConfirm";
import { parseNaturalTime, normLocale } from "@/lib/reminders/time";
import { detectLangFromText } from "@/lib/lang/detectLang";
import FaceToFacePanel from "@/components/chat/FaceToFacePanel";
import CallOverlay from "@/components/chat/CallOverlay";

/* ----------------------------- helpers ----------------------------- */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

async function enablePush() {
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) {
    alert("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
    return;
  }

  const reg = await navigator.serviceWorker.register("/sw.js");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Push denied");
    return;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapid),
  });

  const r = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });

  const t = await r.text();
  console.log("subscribe status", r.status, t);

  alert("Push enabled 🚀");
}

function isIntentText(text: string): boolean {
  const t = (text || '').trim().toLowerCase();
  if (!t) return false;

  const intentWords = [
    // RU
    'хочу', 'надо', 'нужно', 'план', 'цель', 'мечта', 'решил', 'начать', 'перестать',
    'привычк', 'каждый день', 'ежедневно', 'регулярно',

    // UK
    'треба', 'потрібно', 'ціль', 'мрія', 'вирішив', 'почати', 'перестати',
    'звичк', 'щодня', 'кожен день',

    // EN
    'i want', 'i need', 'plan', 'goal', 'dream', 'decided', 'start', 'stop',
    'habit', 'every day', 'daily', 'regularly',

    // ES
    'quiero', 'necesito', 'plan', 'meta', 'objetivo', 'sueño', 'empezar', 'dejar',
    'hábito', 'habito', 'cada día', 'diario', 'regularmente',

    // FR
    'je veux', "j’ai besoin", "j'ai besoin", 'plan', 'objectif', 'rêve', 'reve',
    'commencer', 'arrêter', 'arreter', 'habitude', 'chaque jour', 'quotidien', 'régulièrement',

    // DE
    'ich will', 'ich muss', 'brauche', 'plan', 'ziel', 'traum',
    'anfangen', 'aufhören', 'aufhoeren', 'gewohnheit', 'jeden tag', 'täglich', 'taeglich', 'regelmäßig',

    // PL
    'chcę', 'chce', 'muszę', 'musze', 'potrzebuję', 'potrzebuje',
    'plan', 'cel', 'marzenie', 'zacząć', 'zaczac', 'przestać', 'przestac',
    'nawyk', 'codziennie', 'każdego dnia', 'kazdego dnia', 'regularnie',

    // RO
    'vreau', 'trebuie', 'am nevoie', 'plan', 'scop', 'vis',
    'încep', 'incep', 'renunț', 'renunt',
    'obicei', 'în fiecare zi', 'in fiecare zi', 'zilnic', 'regulat',

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

  return intentWords.some((w) => t.includes(w));
}

function stripReminderPhrase(raw: string) {
  const s = (raw || "").trim();

  // EN: remove "remind me to", "remind me", "remind"
  let out = s.replace(/\bremind\s+(me\s+to|me)\b/i, "").replace(/\bremind\b/i, "");

  // ES: remove "recuérdame", "recuerdame", "recordarme" (MVP)
  out = out
    .replace(/\brecuérdame\b/gi, "")
    .replace(/\brecuerdame\b/gi, "")
    .replace(/\brecordarme\b/gi, "");

  // remove time tails:
  // EN: "in 2 min", "after 10 minutes", "tomorrow at 9:00", "at 18:30"
  out = out
    .replace(/\b(?:in|after)\s+\d+\s*(?:min|mins|minute|minutes|h|hr|hrs|hour|hours)\b/gi, "")
    .replace(/\b(?:tomorrow)\b.*?\b(?:at\s*)?\d{1,2}(?:[:.]\d{2})?\b/gi, "")
    .replace(/\bat\s+\d{1,2}[:.]\d{2}\b/gi, "");

  // ES: "en 10 minutos", "dentro de 5 min", "mañana a las 9:00", "a las 18:30"
  out = out
    .replace(/\b(?:en|dentro\s+de)\s+\d+\s*(?:min|minuto|minutos|hora|horas)\b/gi, "")
    .replace(/\b(?:mañana|manana)\b.*?\b(?:a\s+las|a\s+la)?\s*\d{1,2}(?:[:.]\d{2})?\b/gi, "")
    .replace(/\b(?:a\s+las|a\s+la)\s*\d{1,2}[:.]\d{2}\b/gi, "");

  // RU (если вдруг)
  out = out.replace(/\bчерез\s+\d+\s*(?:м|мин|минута|минуту|минуты|минут|час|часа|часов|ч)?\b/gi, "");

  // cleanup spaces
  out = out.replace(/\s{2,}/g, " ").trim();

  return out || s; // fallback: если всё вырезали — вернём исходник
}

function buildNextStepAfterGoal(locale: string) {
  const l = (locale || 'en').toLowerCase();

  if (l.startsWith('ru'))
    return 'Хочешь добавить небольшой следующий шаг, чтобы двигаться дальше?';

  if (l.startsWith('uk'))
    return 'Хочеш додати маленький наступний крок, щоб рухатися далі?';

  if (l.startsWith('ro'))
    return 'Vrei să adăugăm un mic pas următor ca să mergem mai departe?';

  if (l.startsWith('fr'))
    return 'Tu veux ajouter un petit pas suivant pour continuer à avancer ?';

  if (l.startsWith('es'))
    return '¿Quieres añadir un pequeño siguiente paso para seguir avanzando?';

  if (l.startsWith('de'))
    return 'Möchtest du einen kleinen nächsten Schritt hinzufügen, um weiterzukommen?';

  if (l.startsWith('pl'))
    return 'Chcesz dodać mały kolejny krok, żeby iść dalej?';

  if (l.startsWith('hy'))
    return 'Ցանկանու՞մ ես ավելացնել մի փոքր հաջորդ քայլ՝ առաջ գնալու համար։';

  if (l.startsWith('ka'))
    return 'გინდა დავამატოთ პატარა შემდეგი ნაბიჯი, რომ წინ წავიდეთ?';

  if (l.startsWith('kk'))
    return 'Алға жылжу үшін кішкентай келесі қадам қосқымыз келе ме?';

  // en (default)
  return 'Want to add one small next step to keep moving forward?';
}

function buildNextStepAfterHabit(locale: string) {
  const l = (locale || 'en').toLowerCase();

  if (l.startsWith('ru'))
    return 'Хочешь добавить ещё один небольшой шаг, чтобы становиться лучше каждый день?';

  if (l.startsWith('uk'))
    return 'Хочеш додати ще один маленький крок, щоб ставати кращим щодня?';

  if (l.startsWith('ro'))
    return 'Vrei să adăugăm încă un mic pas pentru a deveni mai bun în fiecare zi?';

  if (l.startsWith('fr'))
    return 'Tu veux ajouter un petit pas de plus pour devenir meilleur chaque jour ?';

  if (l.startsWith('es'))
    return '¿Quieres añadir otro pequeño paso para mejorar cada día?';

  if (l.startsWith('de'))
    return 'Möchtest du noch einen kleinen Schritt hinzufügen, um jeden Tag besser zu werden?';

  if (l.startsWith('pl'))
    return 'Chcesz dodać jeszcze jeden mały krok, żeby stawać się lepszym każdego dnia?';

  if (l.startsWith('hy'))
    return 'Ցանկանու՞մ ես ավելացնել ևս մեկ փոքր քայլ՝ ամեն օր ավելի լավ դառնալու համար։';

  if (l.startsWith('ka'))
    return 'გინდა დავამატოთ კიდევ ერთი პატარა ნაბიჯი, რომ ყოველდღე უკეთესი გახდე?';

  if (l.startsWith('kk'))
    return 'Күн сайын жақсара түсу үшін тағы бір кішкентай қадам қосқымыз келе ме?';

  // en (default)
  return 'Want to add another small step to become better every day?';
}

function buildBigPraise(locale: string, kind: 'goal' | 'habit') {
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

  const what = kind === 'habit'
    ? { ru:'привычку', uk:'звичку', ka:'ჩვევას', hy:'սովորությունը', kk:'әдетті', ro:'obiceiul', pl:'nawyk', de:'Gewohnheit', fr:'habitude', es:'hábito', en:'habit' }
    : { ru:'цель',     uk:'ціль',   ka:'მიზანს', hy:'նպատակը',   kk:'мақсатты', ro:'obiectivul', pl:'cel', de:'Ziel', fr:'objectif', es:'objetivo', en:'goal' };

  return pick({
    ru: `🔥 ВАУ! Ты только что выполнил(а) ${what.ru}!\nЯ реально горжусь тобой 💜\nЭто и есть путь сильных — маленькие действия каждый день.`,
    uk: `🔥 ВАУ! Ти щойно виконав(ла) ${what.uk}!\nЯ реально пишаюся тобою 💜\nМаленькі кроки щодня — це сила.`,
    ka: `🔥 ვაუ! ახლა შენ ${what.ka} შეასრულე!\nმართლა ვამაყობ შენით 💜\nეს არის ძლიერი ადამიანების გზა — პატარა ნაბიჯები ყოველდღე.`,
    hy: `🔥 Վա՜յ! Դու հենց նոր կատարեցիր ${what.hy}։\nԵս իսկապես հպարտ եմ քեզնով 💜\nՍա ուժեղների ճանապարհն է՝ փոքր քայլեր ամեն օր։`,
    kk: `🔥 ВАУ! Сен ${what.kk} орындадың!\nМен шынымен сені мақтан тұтамын 💜\nКүн сайын кішкентай қадам — үлкен күш.`,
    ro: `🔥 WOW! Tocmai ai îndeplinit ${what.ro}!\nSunt mândră de tine 💜\nPași mici zilnic = progres mare.`,
    pl: `🔥 WOW! Właśnie zrealizowałeś(aś) ${what.pl}!\nJestem z ciebie dumna 💜\nMałe kroki każdego dnia — wielka siła.`,
    de: `🔥 WOW! Du hast gerade dein ${what.de} geschafft!\nIch bin wirklich stolz auf dich 💜\nKleine Schritte jeden Tag = echte Stärke.`,
    fr: `🔥 WOW ! Tu viens de réussir ton ${what.fr} !\nJe suis vraiment fière de toi 💜\nDe petits pas chaque jour, c’est ça la force.`,
    es: `🔥 ¡WOW! ¡Acabas de completar tu ${what.es}!\nEstoy orgullosa de ti 💜\nPequeños pasos diarios = gran progreso.`,
    en: `🔥 WOW! You just completed your ${what.en}!\nI’m genuinely proud of you 💜\nSmall daily actions = real strength.`,
  });
}

function buildHabitDoneMessage(locale: string, points: number) {
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
    ru: `Привычка выполнена 🔁 +${points} очка. Отличный ритм! ⭐`,
    uk: `Звичка виконана 🔁 +${points} очка. Крутий темп! ⭐`,
    ka: `ჩვევა შესრულებულია 🔁 +${points} ქულა. მაგარი ტემპია! ⭐`,
    hy: `Սովորությունը կատարված է 🔁 +${points} միավոր։ Շարունակիր նույն կերպ! ⭐`,
    kk: `Әдет орындалды 🔁 +${points} ұпай. Тамаша қарқын! ⭐`,
    ro: `Obicei îndeplinit 🔁 +${points} puncte. Ritm excelent! ⭐`,
    pl: `Nawyk wykonany 🔁 +${points} punktów. Świetne tempo! ⭐`,
    de: `Gewohnheit erledigt 🔁 +${points} Punkte. Starkes Tempo! ⭐`,
    fr: `Habitude validée 🔁 +${points} points. Super rythme ! ⭐`,
    es: `Hábito completado 🔁 +${points} puntos. ¡Buen ritmo! ⭐`,
    en: `Habit completed 🔁 +${points} points. Keep the streak! ⭐`,
  });
}

function buildGoalDoneCongrats(locale: string, added: number, total: number) {
  const L: Record<string, (a: number, t: number) => string> = {
      ru: (a, t) => `🔥 Вау! Я реально горжусь тобой.\n✅ Цель выполнена: +${a} очков.\n⭐ Всего: ${t} очков.`,
  uk: (a, t) => `🔥 Вау! Я щиро пишаюся тобою.\n✅ Ціль виконано: +${a} балів.\n⭐ Всього: ${t} балів.`,
  kk: (a, t) => `🔥 Вау! Мен сені шынымен мақтан тұтамын.\n✅ Мақсат орындалды: +${a} ұпай.\n⭐ Барлығы: ${t} ұпай.`,
  hy: (a, t) => `🔥 Վա՜յ։ Ես իսկապես հպարտ եմ քեզանով։\n✅ Նպատակը կատարված է՝ +${a} միավոր։\n⭐ Ընդամենը՝ ${t} միավոր։`,
  ka: (a, t) => `🔥 ვაუ! ნამდვილად ვამაყობ შენით.\n✅ მიზანი შესრულებულია: +${a} ქულა.\n⭐ სულ: ${t} ქულა.`,
  fr: (a, t) => `🔥 Wow ! Je suis vraiment fière de toi.\n✅ Objectif atteint : +${a} points.\n⭐ Total : ${t} points.`,
  es: (a, t) => `🔥 ¡Wow! De verdad estoy orgullosa de ti.\n✅ Objetivo completado: +${a} puntos.\n⭐ Total: ${t} puntos.`,
  en: (a, t) => `🔥 Wow! I’m genuinely proud of you.\n✅ Goal completed: +${a} points.\n⭐ Total: ${t} points.`,
  pl: (a, t) => `🔥 Wow! Jestem z Ciebie naprawdę dumna.\n✅ Cel wykonany: +${a} punktów.\n⭐ Razem: ${t} punktów.`,
  de: (a, t) => `🔥 Wow! Ich bin wirklich stolz auf dich.\n✅ Ziel erreicht: +${a} Punkte.\n⭐ Gesamt: ${t} Punkte.`,
  ro: (a, t) => `🔥 Wow! Sunt cu adevărat mândră de tine.\n✅ Obiectiv îndeplinit: +${a} puncte.\n⭐ Total: ${t} puncte.`,
  };

  return (L[locale] ?? L.en)(added, total);
}

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
  const seg = window.location.pathname.split('/').filter(Boolean)[0] || 'en';
  return seg.toLowerCase().startsWith('es') ? 'es' : 'en';
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
function isReminderIntent(text: string) {
  const t = (text || "").trim().toLowerCase();
  if (!t) return false;

  // RU/UK/EN — хватит для старта
  return (
    t.startsWith("напомни") ||
    t.includes("напомни ") ||
    t.startsWith("наполни") === false && false || // (ничего, просто чтобы не было автокорректа :)
    t.startsWith("нагадай") ||
    t.includes("напомнить") ||
    t.includes("напомни мне") ||
    t.includes("remind me") ||
    t.startsWith("remind") ||
    t.includes("напоминание")
  );
}

// очень простой “очиститель” текста напоминания (можешь улучшать потом)
function cleanupReminderText(original: string) {
  let t = (original || "").trim();

  // уберем командные слова
  t = t.replace(/^напомни( мне)?/i, "").trim();
  t = t.replace(/^нагадай( мені)?/i, "").trim();
  t = t.replace(/^remind( me)?/i, "").trim();

  // если осталось пусто — вернем исходник
  return t || original.trim();
}

function computeDueInMin(dueUtcIso: string) {
  const now = Date.now();
  const due = new Date(dueUtcIso).getTime();
  const diffMs = due - now;
  // минимум 1 минута, чтобы не улетело в 0
  return Math.max(1, Math.round(diffMs / 60000));
}
type ParsedReminder =
  | { kind: "relative"; minutes: number }
  | { kind: "tomorrow"; hh: number; mm: number }
  | { kind: "fixed"; hh: number; mm: number };


/* ----------------------------- component ----------------------------- */

export default function ClientPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [activeFeature, setActiveFeature] = useState<ChatFeature>('default');

  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const [serverUserId, setServerUserId] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [me, setMe] = useState<any>(null);

  const LAST_FEATURE_KEY = "mindra_last_feature";

  const VOICE_KEY = "mindra_premium_voice";
  const [premiumVoiceEnabled, setPremiumVoiceEnabled] = useState(false);

useEffect(() => {
  fetch("/api/me")
    .then((r) => r.json())
    .then((j) => {
      setMe(j);
      if (j?.authed && j?.userId) {
        setAuthed(true);
        try {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  fetch("/api/settings/tz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tz }),
  }).catch(() => {});
} catch {}
        setServerUserId(j.userId);

        // ✅ если нет tts или минут не осталось — выключаем тумблер
        if (!j?.tts || (j?.voiceSecondsLeft ?? 0) <= 0) {
          setPremiumVoiceEnabled(false);
          try { localStorage.setItem(VOICE_KEY, "0"); } catch {}
        }
      } else {
        setAuthed(false);
        setServerUserId(null);
      }
    })
    .catch(() => {
      setAuthed(false);
      setServerUserId(null);
      setMe(null);
    });
}, []);

useEffect(() => {
  if (!authed) return;

  fetch("/api/chat/latest")
    .then(r => r.json())
    .then(j => {
      const srv = j?.session;
      if (!srv?.id) return;

      const mapped = {
        id: srv.id,
        title: srv.title || "Chat",
        messages: (srv.messages || []).map((m: any) => ({
          role: m.role,
          content: m.content,
          ts: new Date(m.createdAt).getTime(),
        })),
        createdAt: new Date(srv.createdAt).getTime(),
        updatedAt: new Date(srv.updatedAt).getTime(),
        feature: "default" as any,
      };

      setSessions(prev => {
        const withoutDup = prev.filter(p => p.id !== mapped.id);
        return [mapped, ...withoutDup];
      });

      setCurrentId(mapped.id);
    })
    .catch(() => {});
}, []);


const uid = useMemo(() => serverUserId ?? getOrCreateWebUid(), [serverUserId]);

  const [callOpen, setCallOpen] = useState(false);

  const [lastGoalSuggestion, setLastGoalSuggestion] = useState<{ text: string } | null>(null);
  const [lastHabitSuggestion, setLastHabitSuggestion] = useState<{ text: string } | null>(null);

  type PendingReminder = { text: string; dueUtc: string };

  const [pendingReminder, setPendingReminder] = useState<PendingReminder | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);



  useEffect(() => {
  const stored = loadSessions();

// 1) читаем параметры url
let forced: string | null = null;
let openChat = false;

if (typeof window !== "undefined") {
  const sp = new URLSearchParams(window.location.search);
  forced = sp.get("f");
  openChat = sp.get("open") === "chat";
}

// 2) иначе берём последнюю вкладку из localStorage
let last: string | null = null;
try { last = localStorage.getItem(LAST_FEATURE_KEY); } catch {}

// ✅ ВАЖНО: open=chat всегда побеждает
const desiredFeature = (openChat ? "default" : (forced || last || "default")) as ChatFeature;

  if (stored.length > 0) {
    setSessions(stored);

    // ✅ выбираем текущую сессию под desiredFeature
    const isDiary = (id: any) => {
      const s = String(id || "");
      return s.startsWith("goal:") || s.startsWith("habit:");
    };

    const pick =
      stored.find((s) => (s.feature ?? "default") === desiredFeature && !isDiary(s.id)) ??
      stored.find((s) => (s.feature ?? "default") === desiredFeature) ??
      stored[0];

    setCurrentId(pick?.id);
    setActiveFeature(desiredFeature);

    // если url forced был — можно убрать параметр
    if ((forced || openChat) && typeof window !== "undefined") {
  const sp = new URLSearchParams(window.location.search);
  sp.delete("f");
  sp.delete("open");
  const next = `${window.location.pathname}${sp.toString() ? "?" + sp.toString() : ""}`;
  window.history.replaceState({}, "", next);
}
  } else {
    const first = createEmptySession(desiredFeature);
    setSessions([first]);
    setCurrentId(first.id);
    setActiveFeature(desiredFeature);
  }
}, []);

  useEffect(() => {
    if (sessions.length) saveSessions(sessions);
  }, [sessions]);

  const current = useMemo(
    () => sessions.find((s) => s.id === currentId),
    [sessions, currentId],
  );

  const handleDeleteSession = (id: string) => {
  const locale = getLocaleFromPath();
  const ok = window.confirm(
    locale === 'es'
      ? '¿Eliminar este chat?'
      : 'Delete this chat?'
  );
  if (!ok) return;

  setSessions((prev) => {
    const next = prev.filter((s) => s.id !== id);

    // если удалили текущий — переключаемся на самый свежий чат этой же фичи
    if (currentId === id) {
      const fallback =
        next.find((s) => (s.feature ?? 'default') === activeFeature) ?? next[0];

      setCurrentId(fallback?.id);
      if (fallback) setActiveFeature(fallback.feature ?? 'default');
    }

    return next.length ? next : [createEmptySession(activeFeature)];
  });
};

  const updateCurrentSession = (updater: (prev: ChatSession) => ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === currentId ? updater(s) : s)));
  };

  const handleSelectSession = (id: string) => {
    setCurrentId(id);
    const found = sessions.find((s) => s.id === id);
    if (found) setActiveFeature(found.feature ?? 'default');
    try { localStorage.setItem(LAST_FEATURE_KEY, found?.feature ?? "default"); } catch {}
    setLastGoalSuggestion(null);
    setLastHabitSuggestion(null);
  };

  const handleNewChat = () => {
    const fresh = createEmptySession(activeFeature);
    setSessions((prev) => [fresh, ...prev]);
    setCurrentId(fresh.id);
    setLastGoalSuggestion(null);
    setLastHabitSuggestion(null);
  };
 
const pushToFeatureChat = (feature: ChatFeature, content: string) => {
  const msg = { role: 'assistant' as const, content, ts: Date.now() };

  setSessions((prev: any[]) => {
    const list = [...prev];

    const isDiary = (id: any) => {
      const s = String(id || '');
      return s.startsWith('goal:') || s.startsWith('habit:');
    };

    // ищем обычный чат фичи (не diary)
    let idx = list.findIndex((s) => (s.feature ?? 'default') === feature && !isDiary(s.id));

    if (idx === -1) {
      const fresh = createEmptySession(feature);
      fresh.messages = [...(fresh.messages || []), msg];
      fresh.updatedAt = Date.now();
      return [fresh, ...list];
    }

    list[idx] = {
      ...list[idx],
      messages: [...(list[idx].messages || []), msg],
      updatedAt: Date.now(),
    };

    return list;
  });
};

  const handleChangeFeature = (feature: ChatFeature) => {
    try { localStorage.setItem(LAST_FEATURE_KEY, feature); } catch {}
    setVoiceNotice(null);
    if (feature === "call") setCallOpen(true);
  setActiveFeature(feature);
  setLastGoalSuggestion(null);
  setLastHabitSuggestion(null);

  setSessions((prev: any[]) => {
    // 1) очищаем выполненные diary
    const cleaned = prev.filter((s) => {
      const isDiary = s?.id?.startsWith('goal:') || s?.id?.startsWith('habit:');
      const isDone = Boolean(s?.goalDone || s?.habitDone);
      return !(isDiary && isDone);
    });

    // 2) переключаемся на существующую сессию фичи или создаём новую
    const existing = cleaned.find((s) => (s.feature ?? 'default') === feature);
    if (existing) {
      setCurrentId(existing.id);
      return cleaned;
    }

    const fresh = createEmptySession(feature);
    setCurrentId(fresh.id);
    return [fresh, ...cleaned];
  });
};

const markHabitDone = async (habitId: string) => {
  // 1) мгновенно скрываем кнопку
  updateCurrentSession((prev: any) => ({
    ...prev,
    habitDone: true,
    updatedAt: Date.now(),
  }));

  const uid = serverUserId ?? getOrCreateWebUid();

  const locale = getLocaleFromPath();

  try {
    const res = await fetch(
      `/api/habits/${encodeURIComponent(habitId)}/done?user_id=${encodeURIComponent(uid)}`,
      { method: 'POST' },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      const detail = data?.detail || data?.error || 'unknown error';
      updateCurrentSession((prev: any) => ({
        ...prev,
        habitDone: false,
        messages: [
          ...(prev.messages || []),
          { role: 'assistant', content: `I couldn't mark the habit as completed 😕 (status ${res.status})\n${detail}`, ts: Date.now() },
        ],
        updatedAt: Date.now(),
      }));
      return;
    }

    const added = Number(data.points ?? 0);

    // ✅ начисляем очки (вот тут и была причина что 9 не суммировались)
    addPoints(uid, added);

    // 2) diary: только похвала, БЕЗ вопросов
    updateCurrentSession((prev: any) => ({
      ...prev,
      messages: [
        ...(prev.messages || []),
        { role: 'assistant', content: buildHabitDoneMessage(locale, added), ts: Date.now() },
        { role: 'assistant', content: buildBigPraise(locale, 'habit'), ts: Date.now() + 1 },
      ],
      updatedAt: Date.now(),
    }));

    // 3) вопрос/след.шаг — в общий чат "Привычки"
    pushToFeatureChat('habits', buildNextStepAfterHabit(locale));
  } catch {
    updateCurrentSession((prev: any) => ({
      ...prev,
      habitDone: false,
      messages: [
        ...(prev.messages || []),
        { role: 'assistant', content: 'Ошибка сети 😕 Попробуй ещё раз.', ts: Date.now() },
      ],
      updatedAt: Date.now(),
    }));
  }
};

const createPendingReminder = async () => {
  if (!pendingReminder) return;
  setReminderBusy(true);

  const locale = getLocaleFromPath();
  const l = (locale || "en").toLowerCase();

  const t = {
    ok:
      l.startsWith("es")
        ? "Perfecto ✅ Ya creé el recordatorio. Te avisaré a tiempo 🙂"
        : "Perfect ✅ I created the reminder. I’ll notify you at the right time 🙂",
    failTitle:
      l.startsWith("es")
        ? "No pude crear el recordatorio 😕"
        : "I couldn’t create the reminder 😕",
  };

  try {
    const dueInMin = computeDueInMin(pendingReminder.dueUtc);

    const r = await fetch("/api/reminders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: pendingReminder.text,
        dueInMin,
        // если твой API поддерживает — можешь прокинуть:
        // locale,
      }),
    });

    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      throw new Error(j?.error || `create reminder failed (${r.status})`);
    }

    updateCurrentSession((prev: any) => ({
      ...prev,
      messages: [
        ...(prev.messages || []),
        { role: "assistant", content: t.ok, ts: Date.now() },
      ],
      updatedAt: Date.now(),
    }));

    setPendingReminder(null);
  } catch (e: any) {
    updateCurrentSession((prev: any) => ({
      ...prev,
      messages: [
        ...(prev.messages || []),
        {
          role: "assistant",
          content: `${t.failTitle}\n${String(e?.message ?? e)}`,
          ts: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    }));
  } finally {
    setReminderBusy(false);
  }
};

const saveAsHabit = async (habitText: string) => {
  try {
    const uid = serverUserId ?? getOrCreateWebUid();


    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: habitText, user_id: uid }),
    });

    const data = await res.json().catch(() => null);
    const habitId = data?.id ? String(data.id) : undefined;

    // если хочешь дневник привычки как у целей:
    if (habitId) {
      const diaryId = `habit:${habitId}`;
      const now = Date.now();

      setSessions((prev) => {
        if (prev.some((s) => s.id === diaryId)) return prev;

        const diary: ChatSession = {
          id: diaryId,
          title: habitText.length > 40 ? habitText.slice(0, 40) + '…' : habitText,
          messages: [
            {
              role: 'assistant',
              content: `Okay ✅ Habit added: "${habitText}".\nDo you want us to make it more convenient in terms of time? 🙂`,
              ts: now + 1,
            },
          ],
          createdAt: now,
          updatedAt: now,
          feature: 'habits',
          habitId,
        } as any;

        return [diary, ...prev];
      });

      setActiveFeature('habits');
      setCurrentId(diaryId);
    }
  } finally {
    setLastHabitSuggestion(null);
  }
};



const markGoalDone = async (goalId: string) => {
  // 1) мгновенно скрываем кнопку
  updateCurrentSession((prev: any) => ({
    ...prev,
    goalDone: true,
    updatedAt: Date.now(),
  }));

  try {
    const uid = serverUserId ?? getOrCreateWebUid();

    const locale = getLocaleFromPath();

    const res = await fetch(
      `/api/goals/${encodeURIComponent(goalId)}/done?user_id=${encodeURIComponent(uid)}`,
      { method: 'POST' },
    );

    const data = await res.json().catch(() => null);

    // 2) если API упал — откат
    if (!res.ok || !data?.ok) {
      const detail = data?.detail || data?.error || 'unknown error';
      updateCurrentSession((prev: any) => ({
        ...prev,
        goalDone: false,
        messages: [
          ...(prev.messages || []),
          {
            role: 'assistant',
            content: `I couldn't mark the target 😕 (status ${res.status})\n${detail}`,
            ts: Date.now(),
          },
        ],
        updatedAt: Date.now(),
      }));
      return;
    }

    const added = Number(data.points ?? 0);
    const total = addPoints(uid, added);

    // 3) в diary — только похвала БЕЗ вопроса
    updateCurrentSession((prev: any) => ({
      ...prev,
      messages: [
        ...(prev.messages || []),
        { role: 'assistant', content: buildGoalDoneCongrats(locale, added, total), ts: Date.now() },
      ],
      updatedAt: Date.now(),
    }));

    // 4) вопрос/след.шаг — в общий чат "Цели"
    pushToFeatureChat('goals', buildNextStepAfterGoal(locale));
  } catch {
    updateCurrentSession((prev: any) => ({
      ...prev,
      goalDone: false,
      messages: [
        ...(prev.messages || []),
        { role: 'assistant', content: 'Network error 😕 Please try again.', ts: Date.now() },
      ],
      updatedAt: Date.now(),
    }));
  }
};

  const saveAsGoal = async (goalText: string) => {
    try {
      const uid = serverUserId ?? getOrCreateWebUid();


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
            title: 'Training',
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


const audioRef = useRef<HTMLAudioElement | null>(null);

useEffect(() => {
  if (typeof window === "undefined") return;

  const sync = () => {
    setPremiumVoiceEnabled(localStorage.getItem(VOICE_KEY) === "1");
  };

  sync();

  window.addEventListener("mindra_premium_voice_changed", sync);
  window.addEventListener("storage", sync);

  return () => {
    window.removeEventListener("mindra_premium_voice_changed", sync);
    window.removeEventListener("storage", sync);
  };
}, []);

const handleSend = async (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return;

  if (!current) {
    const fresh = createEmptySession(activeFeature);
    setSessions([fresh]);
    setCurrentId(fresh.id);
    setLastGoalSuggestion(null);
    setLastHabitSuggestion(null);
    return;
  }

  const uid = serverUserId ?? getOrCreateWebUid();

  const locale = getLocaleFromPath();
  const lang = locale.toLowerCase().startsWith("es") ? "es" : "en";
  const isGoalDiary = Boolean(current.id?.startsWith("goal:"));
  const isHabitDiary = Boolean(current.id?.startsWith("habit:"));

  setLastGoalSuggestion(null);
  setLastHabitSuggestion(null);

  const ts = Date.now();
  const userMsg: ChatMessage = { role: "user", content: trimmed, ts };

  updateCurrentSession((prev) => ({
    ...prev,
    feature: prev.feature ?? activeFeature,
    messages: [...prev.messages, userMsg],
    title: prev.title === "New chat" ? newSessionTitle([...prev.messages, userMsg]) : prev.title,
    updatedAt: Date.now(),
  }));

  setSending(true);

  fetch("/api/activity/ping", { method: "POST" }).catch(() => {});


  // ---------- helper: localized reminder preview text ----------
  const buildReminderPreview = (loc: string, reminderText: string) => {
    const l = (loc || "en").toLowerCase();
    if (l.startsWith("es")) {
      return `Perfecto ✅\n¿Creo el recordatorio para: **${reminderText}**?\n(Confirma abajo 👇)`;
    }
    return `Got it ✅\nShould I create a reminder for: **${reminderText}**?\n(Confirm below 👇)`;
  };

  // ---------------- REMINDERS: parse + confirm UI (NO BOT CALL) ----------------
  try {
    if (activeFeature === "reminders") {
      const parsed = parseNaturalTime(trimmed, normLocale(locale));

      if (parsed) {
        const now = new Date();
        let due: Date | null = null;

        if (parsed.kind === "relative") {
          due = new Date(now.getTime() + parsed.minutes * 60_000);
        } else if (parsed.kind === "tomorrow") {
          due = new Date(now);
          due.setDate(due.getDate() + 1);
          due.setHours(parsed.hh, parsed.mm, 0, 0);
        } else if (parsed.kind === "fixed") {
          due = new Date(now);
          due.setHours(parsed.hh, parsed.mm, 0, 0);
          if (due.getTime() <= now.getTime()) due.setDate(due.getDate() + 1);
        }

        const stripReminderPhraseLocal = (raw: string) => {
          let s = raw.trim();

          s = s
            .replace(
              /^\s*(напомни(ть)?(\s+мне)?|поставь(\s+мне)?\s+напоминание|сделай\s+напоминание)\s*/i,
              ""
            )
            .replace(/^\s*(remind\s+me(\s+to)?|set\s+a\s+reminder(\s+to)?)\s*/i, "")
            .replace(/^\s*(recuérdame|recuerdame|pon\s+un\s+recordatorio|establece\s+un\s+recordatorio)\s*(que\s+)?/i, "");

          s = s.replace(/\b(?:in|after)\s+\d+\s*(min|mins|minute|minutes|h|hr|hrs|hour|hours)\b.*$/i, "");
          s = s.replace(/\b(?:en|dentro\s+de)\s+\d+\s*(min|minuto|minutos|hora|horas)\b.*$/i, "");
          s = s.replace(/\bчерез\s+\d+\s*(м|мин|минута|минуту|минуты|минут|час|часа|часов|ч)?\b.*$/i, "");

          s = s.replace(/\b(?:tomorrow|mañana|manana|завтра)\b.*$/i, "");
          s = s.replace(/\b(?:at|a\s+las|a\s+la|в)\s*\d{1,2}(?:[:.]\d{2})?\b.*$/i, "");

          s = s.trim();
          return s || raw.trim();
        };

        if (due) {
          const reminderText = stripReminderPhraseLocal(trimmed);

          setPendingReminder({ text: reminderText, dueUtc: due.toISOString() });

          const preview = buildReminderPreview(locale, reminderText);
          const botMsg: ChatMessage = { role: "assistant", content: preview, ts: Date.now() };

          updateCurrentSession((prev) => ({
            ...prev,
            feature: prev.feature ?? activeFeature,
            messages: [...prev.messages, botMsg],
            updatedAt: Date.now(),
          }));

          setSending(false);
          return;
        }
      }
    }
  } catch (e) {
    console.log("[REMINDER] parse error", e);
  }

  // ---------------- main bot request ----------------
  try {
    const res = await fetch("/api/web-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: trimmed,
        sessionId: current.id,
        feature: activeFeature,
        user_id: uid,
        lang,
        wantVoice: premiumVoiceEnabled,
      }),
    });

    let replyText = "Sorry, the server is currently unavailable.";
    let goalSuggestion: { text: string } | null = null;
    let habitSuggestion: { text: string } | null = null;

    const data = await res.json().catch(() => null);
    let finalData: any = data;

    // 0) voiceBlocked -> выключаем тумблер + показываем notice
    if (data?.voiceBlocked) {
      setPremiumVoiceEnabled(false);
      try { localStorage.setItem(VOICE_KEY, "0"); } catch {}

      if (data?.voiceReason === "login_required") {
        setVoiceNotice("Please sign in to use premium voice.");
      } else {
        setVoiceNotice("Premium voice is not available right now.");
      }
    } else {
      setVoiceNotice(null);
    }

    // 1) если голос был включен, но его заблокировали ИЛИ reply пустой — перезапросим без голоса
    const needFallback =
      premiumVoiceEnabled && (data?.voiceBlocked || !data?.reply || !String(data.reply).trim());

    if (needFallback) {
      const res2 = await fetch("/api/web-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: trimmed,
          sessionId: current.id,
          feature: activeFeature,
          user_id: uid,
          lang,
          wantVoice: false,
        }),
      });

      const data2 = await res2.json().catch(() => null);
      if (data2) finalData = data2;
    }

    // 2) audio autoplay (если пришёл tts)
    const ttsUrl = finalData?.tts?.audioUrl;
    if (ttsUrl && typeof ttsUrl === "string") {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        const a = new Audio(ttsUrl);
        audioRef.current = a;
        a.play().catch(() => {});
      } catch {}
    }

    // 3) reply
    if (finalData?.reply && typeof finalData.reply === "string" && finalData.reply.trim()) {
      replyText = finalData.reply.trim();
    }

    // 4) suggestions
    const intent = isIntentText(trimmed);

    if (!isGoalDiary && activeFeature === "goals" && intent) {
      const s = finalData?.goal_suggestion?.text;
      goalSuggestion = s ? { text: String(s) } : { text: trimmed };
    } else {
      goalSuggestion = null;
    }

    if (!isHabitDiary && activeFeature === "habits" && intent) {
      const s = finalData?.habit_suggestion?.text;
      habitSuggestion = s ? { text: String(s) } : { text: trimmed };
    } else {
      habitSuggestion = null;
    }

    setLastGoalSuggestion(goalSuggestion);
    setLastHabitSuggestion(habitSuggestion);

    const botMsg: ChatMessage = { role: "assistant", content: replyText, ts: Date.now() };

    updateCurrentSession((prev) => ({
      ...prev,
      feature: prev.feature ?? activeFeature,
      messages: [...prev.messages, botMsg],
      updatedAt: Date.now(),
    }));
  } catch (e) {
    console.log("handleSend error:", e);

    const errMsg: ChatMessage = {
      role: "assistant",
      content: "Server error, please try again later 🙏",
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

const handleSendImage = async (file: File) => {
  if (!current) return;

  const locale = getLocaleFromPath();
  const lang = locale.toLowerCase().startsWith("es") ? "es" : "en";

  // ✅ 1) показываем картинку сразу в чате (локально)
  const localUrl = URL.createObjectURL(file);
  const ts = Date.now();

  updateCurrentSession((prev: any) => ({
    ...prev,
    messages: [...prev.messages, { role: "user", content: "", ts, imageUrl: localUrl }],
    updatedAt: Date.now(),
  }));

  setSending(true);

  try {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("text", ""); // можно потом сюда добавить подпись
    fd.append("lang", lang);

    const r = await fetch("/api/vision", { method: "POST", body: fd });
    const j = await r.json().catch(() => null);

    if (!r.ok || !j?.ok) {
      throw new Error(j?.error || `vision failed (${r.status})`);
    }

    const replyText = String(j.reply || "").trim();

    updateCurrentSession((prev: any) => ({
      ...prev,
      messages: [...prev.messages, { role: "assistant", content: replyText, ts: Date.now() }],
      updatedAt: Date.now(),
    }));
  } catch (e: any) {
    updateCurrentSession((prev: any) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: "assistant", content: `Photo analyze error 😕\n${String(e?.message ?? e)}`, ts: Date.now() },
      ],
      updatedAt: Date.now(),
    }));
  } finally {
    setSending(false);
  }
};


useEffect(() => {
  const ping = () => fetch("/api/activity/ping", { method: "POST" }).catch(() => {});

  // при первом входе
  ping();

  // при фокусе вкладки
  window.addEventListener("focus", ping);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") ping();
  });

  return () => {
    window.removeEventListener("focus", ping);
  };
}, []);


const locale = getLocaleFromPath();
const showVoiceToggle =
  activeFeature === "default" || activeFeature === "goals" || activeFeature === "habits";

return (
  <div className="h-[100dvh] overflow-hidden bg-[var(--bg)] text-[var(--text)]">
    <div className="flex h-full">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNewChat={handleNewChat}
        onSelect={handleSelectSession}
        activeFeature={activeFeature}
        onChangeFeature={handleChangeFeature}
        onDelete={handleDeleteSession}
      />

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        {activeFeature === "settings" ? (
          <div className="flex-1 overflow-y-auto">
            <SettingsPanel
              premiumVoiceEnabled={premiumVoiceEnabled}
              onTogglePremiumVoice={(v) => {
                setPremiumVoiceEnabled(v);
                setVoiceNotice(null);
                try {
                  localStorage.setItem(VOICE_KEY, v ? "1" : "0");
                  window.dispatchEvent(new Event("mindra_premium_voice_changed"));
                } catch {}
              }}
              voiceNotice={voiceNotice}
            />
          </div>
        ) : (
  <>
    <div className="flex-1 min-h-0 overflow-hidden">
      <ChatWindow
        messages={current ? current.messages : []}
        activeFeature={activeFeature}
        goalSuggestion={lastGoalSuggestion}
        habitSuggestion={lastHabitSuggestion}
        onSaveGoal={saveAsGoal}
        onSaveHabit={saveAsHabit}
        onMarkGoalDone={markGoalDone}
        onMarkHabitDone={markHabitDone}
        pendingReminder={pendingReminder}
        onConfirmReminder={createPendingReminder}
        onCancelReminder={() => setPendingReminder(null)}
        reminderBusy={reminderBusy}
        currentSessionId={current?.id}
        locale={locale}
        goalDone={Boolean((current as any)?.goalDone)}
        habitDone={Boolean((current as any)?.habitDone)}
      />
    </div>

    {voiceNotice ? (
      <div className="mx-auto max-w-3xl px-6 pb-2 text-xs text-[var(--muted)] text-right">
        {voiceNotice}
      </div>
    ) : null}

    <Composer
      onSend={handleSend}
      disabled={sending}
      onVoiceToText={async (blob) => {
        const fd = new FormData();
        fd.append("audio", blob, "voice.webm");

        const r = await fetch("/api/voice-to-text", { method: "POST", body: fd });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) throw new Error(j?.error || "voice_to_text_failed");
        return String(j.text || "").trim();
      }}
      onSendImages={async (caption, files) => {
        const ts = Date.now();
        const previews = files.map((f) => URL.createObjectURL(f));

        updateCurrentSession((prev: any) => ({
          ...prev,
          messages: [
            ...(prev.messages || []),
            { role: "user", content: caption || "", ts, images: previews },
          ],
          updatedAt: Date.now(),
        }));

        const fd = new FormData();
        files.forEach((f) => fd.append("images", f));
        fd.append("input", caption || "");
        fd.append("sessionId", current?.id || "");
        fd.append("feature", activeFeature);
        fd.append("user_id", uid);
        fd.append("lang", locale.toLowerCase().startsWith("es") ? "es" : "en");

        setSending(true);
        try {
          const r = await fetch("/api/web-chat-images", { method: "POST", body: fd });
          const j = await r.json().catch(() => null);
          if (!r.ok || !j?.ok || !j?.reply) throw new Error(j?.error || "images_chat_failed");

          updateCurrentSession((prev: any) => ({
            ...prev,
            messages: [...(prev.messages || []), { role: "assistant", content: String(j.reply), ts: Date.now() }],
            updatedAt: Date.now(),
          }));
        } finally {
          setSending(false);
          setTimeout(() => previews.forEach((u) => URL.revokeObjectURL(u)), 3000);
        }
      }}
    />
  </>
)}


        {/* ✅ Fullscreen Call Overlay */}
        {callOpen && (
          <CallOverlay
            userId={serverUserId ?? getOrCreateWebUid()}
            lang={locale.toLowerCase().startsWith("es") ? "es" : "en"}
            wantVoice={premiumVoiceEnabled}
            onClose={() => {
              setCallOpen(false);
              setActiveFeature("default"); // чтобы Call не был подсвечен
            }}
          />
        )}
      </main>
    </div>
  </div>
);
}