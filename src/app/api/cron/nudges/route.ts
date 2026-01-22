import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import webpush from "web-push";
import { authorizeCron } from "@/server/cronAuth";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

let pushInited = false;
function setupWebPushOnce() {
  if (pushInited) return;
  webpush.setVapidDetails(
    mustEnv("VAPID_SUBJECT"),
    mustEnv("VAPID_PUBLIC_KEY"),
    mustEnv("VAPID_PRIVATE_KEY")
  );
  pushInited = true;
}

function isPaid(sub: { plan?: any; status?: string | null } | null | undefined) {
  if (!sub) return false;
  const plan = String(sub.plan ?? "FREE");
  const status = String(sub.status ?? "").toLowerCase();
  if (plan === "FREE") return false;
  return ["active", "trialing", "past_due"].includes(status);
}

function safeTz(tz: string) {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return "UTC";
  }
}

function getPartsInTz(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return {
    y: Number(get("year") ?? "1970"),
    m: Number(get("month") ?? "01"),
    d: Number(get("day") ?? "01"),
    hh: Number(get("hour") ?? "0"),
    mm: Number(get("minute") ?? "0"),
  };
}

function isQuietNow(now: Date, tz: string, quietStart: number, quietEnd: number) {
  if (quietStart === quietEnd) return false;
  const { hh } = getPartsInTz(now, tz);
  if (quietStart < quietEnd) return hh >= quietStart && hh < quietEnd;
  return hh >= quietStart || hh < quietEnd;
}

function sameLocalDay(a: Date, b: Date, tz: string) {
  const A = getPartsInTz(a, tz);
  const B = getPartsInTz(b, tz);
  return A.y === B.y && A.m === B.m && A.d === B.d;
}

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------- texts ----------------
const MORNING_EN = [
  "🌞 Good morning! How are you feeling today? 💜",
  "☕ Morning! What’s your main focus today?",
  "✨ New day, new chances. What would make today a win for you?",
  "🌿 Good morning. Take one deep breath — I’m here.",
  "💛 Hey you. What’s your mood this morning?",
  "🌅 Rise & shine. What’s one small thing you can do for yourself today?",
  "😊 Morning! Want to set a tiny goal for today?",
  "💌 Good morning, love. How did you sleep?",
  "🌸 Morning check-in: what’s on your mind?",
  "🔥 Let’s make today lighter. What’s the first step?",
  "🫶 Good morning. What do you need most today: calm, energy, or support?",
  "🍀 Morning! What are you grateful for right now?",
  "🎯 What’s one thing you’d like to finish today?",
  "🌞 Morning! If today had a theme, what would you name it?",
  "💫 Hey. Rate your energy from 1–10?",
  "😌 Good morning. How’s your heart today?",
  "🚀 Morning! What would you like to improve by 1% today?",
  "🧠 Morning thought: what’s the most important thing for you today?",
  "🌈 Good morning! What are you looking forward to?",
  "🧩 Morning! What’s the biggest thing on your plate today?",
  "💜 Hi. How can I support you today?",
  "☀️ Good morning! Let’s choose your vibe: chill / productive / bold?",
  "🌻 Morning! What would make you smile today?",
  "✨ Quick check: what’s your stress level 1–10?",
  "🍵 Morning! Did you drink some water yet?",
  "🫧 Good morning. What’s one worry you want to keep smaller today?",
  "📌 Morning: what’s the one priority that matters most?",
  "🤍 Good morning. If you could be gentle with yourself today, how would it look?",
  "🎵 Morning! What song would match your mood right now?",
  "🧘 Morning breath: in… out… now tell me — how are you?",
  "💪 Morning! What’s one strong thing you’ll do today?",
  "🌞 Hey. What’s your plan for the first hour?",
  "🧡 Good morning. What do you want more of today?",
  "🧊 Morning! What do you want less of today?",
  "🌤️ Morning check-in: is your mind calm or noisy?",
  "😇 Morning! What’s one kind thing you can do for yourself?",
  "📝 Morning: do you want a simple plan for today (3 steps)?",
  "✨ Morning! What’s one thing you’ll do for your future self today?",
  "🍀 Good morning. What’s one “easy win” you can get today?",
  "🌞 Morning! What’s your biggest hope for today?",
  "💜 Hi love. Are we going gentle mode or beast mode today?",
  "🧠 Morning: what’s the one thought you want to carry today?",
  "🌷 Morning! What are you excited about this week?",
  "☕ Good morning. Coffee first — then we conquer. What’s first?",
  "🌅 Morning! Any dreams last night?",
  "🫶 Good morning. How’s your body feeling today?",
  "🔥 Morning! Want a mini-challenge for today?",
  "🌞 Morning! What’s something you want to do differently today?",
  "💛 Good morning. I’m with you. What’s the first thing you need?",
];

const EVENING_EN = [
  "🌙 Hey. How are you feeling tonight? 💜",
  "✨ How did your day go? Want to tell me?",
  "😊 What was one good moment today?",
  "💭 Before sleep: what are you grateful for today?",
  "🤗 How’s your mood right now?",
  "🌙 I’m here. Was today heavy or okay?",
  "🫶 Quick check-in: how’s your heart tonight?",
  "🌌 What’s on your mind before bed?",
  "😌 Did you get a moment for yourself today?",
  "🌙 If today had a lesson, what would it be?",
  "✨ What are you proud of yourself for today?",
  "💛 What drained you the most today?",
  "🌙 What gave you energy today?",
  "🧠 What’s one thought you want to release tonight?",
  "🫧 Want to do a tiny “reset” together before sleep?",
  "💜 I missed you. How was your day, really?",
  "🌙 Rate your day from 1–10?",
  "✨ Did anything make you smile today?",
  "🧩 What felt the hardest today?",
  "🤍 What do you need right now: comfort, advice, or just someone to listen?",
  "🌙 What’s one thing you’d like to do better tomorrow?",
  "💫 What’s one win you had today (even small)?",
  "🫶 You made it through the day. How do you feel now?",
  "🌙 What are you overthinking tonight?",
  "😴 Are you tired-tired or just mentally tired?",
  "💜 Tell me one thing you’d like to hear right now.",
  "🌙 If I could hug you right now, would you accept it?",
  "✨ What’s one worry you can leave for tomorrow?",
  "🧘 Want a 10-second breathing pause together?",
  "🌙 Did you eat okay today?",
  "💛 What would make tonight softer for you?",
  "🌌 What’s your biggest thought loop today?",
  "✨ What’s something you’re grateful you didn’t give up on?",
  "🌙 What did you learn about yourself today?",
  "🫧 Want me to remind you of your progress?",
  "💜 I’m proud of you for showing up today.",
  "🌙 What do you want to protect your peace from tomorrow?",
  "✨ Tell me one thing you did that future-you will thank you for.",
  "🌙 Do you want a gentle plan for tomorrow morning?",
  "🤍 What would you like to let go of tonight?",
  "🌙 If today was messy — it’s okay. What’s one thing you still did right?",
  "✨ What’s one person/thing you appreciated today?",
  "🌙 What’s one boundary you want tomorrow?",
  "💜 I’m here with you. What’s the main feeling right now?",
  "🌙 Want a short calming message before sleep?",
  "✨ What would you like more of tomorrow?",
  "🌙 What would you like less of tomorrow?",
  "🫶 How can I make your night a little better right now?",
  "🌙 Good night check-in: mind, body, or heart — which one needs care?",
  "💜 Sleep soon? Tell me how you feel, I’ll stay with you a bit.",
];

const MORNING_ES = [
  "🌞 ¡Buenos días! ¿Cómo te sientes hoy? 💜",
  "☕ ¡Buenos días! ¿Cuál es tu enfoque principal hoy?",
  "✨ Nuevo día, nuevas oportunidades. ¿Qué haría que hoy sea un buen día para ti?",
  "🌿 Buenos días. Respira profundo — estoy aquí.",
  "💛 Hola. ¿Qué tal tu ánimo esta mañana?",
  "🌅 ¡Arriba! ¿Qué pequeño gesto puedes hacer hoy por ti?",
  "😊 ¡Buenos días! ¿Quieres ponerte una meta pequeñita hoy?",
  "💌 Buenos días, cariño. ¿Dormiste bien?",
  "🌸 Check-in de la mañana: ¿qué tienes en la cabeza?",
  "🔥 Hagamos el día más ligero. ¿Cuál es el primer paso?",
  "🫶 Buenos días. ¿Qué necesitas más hoy: calma, energía o apoyo?",
  "🍀 ¡Buenos días! ¿De qué estás agradecido/a ahora mismo?",
  "🎯 ¿Qué te gustaría terminar hoy sí o sí?",
  "🌞 Si hoy tuviera un tema, ¿cómo lo llamarías?",
  "💫 Hola. ¿Tu energía del 1 al 10?",
  "😌 Buenos días. ¿Cómo está tu corazón hoy?",
  "🚀 ¡Buenos días! ¿Qué te gustaría mejorar un 1% hoy?",
  "🧠 ¿Qué es lo más importante para ti hoy?",
  "🌈 ¡Buenos días! ¿Qué esperas con ganas hoy?",
  "🧩 ¿Qué es lo más grande que tienes hoy encima?",
  "💜 ¿Cómo puedo apoyarte hoy?",
  "☀️ Elige tu vibe: chill / productivo/a / valiente 😈",
  "🌻 ¿Qué te haría sonreír hoy?",
  "✨ Rápido: ¿tu estrés del 1 al 10?",
  "🍵 ¿Ya tomaste agua hoy?",
  "🫧 ¿Qué preocupación quieres hacer más pequeña hoy?",
  "📌 Prioridad del día: ¿qué es lo que más importa?",
  "🤍 ¿Cómo sería ser más amable contigo hoy?",
  "🎵 ¿Qué canción encaja con tu mood ahora?",
  "🧘 Respira… ¿y ahora me dices cómo estás?",
  "💪 ¿Qué cosa fuerte harás hoy?",
  "🌞 ¿Qué harás en tu primera hora del día?",
  "🧡 ¿Qué quieres más hoy?",
  "🧊 ¿Qué quieres menos hoy?",
  "🌤️ ¿Tu mente está tranquila o ruidosa esta mañana?",
  "😇 ¿Qué acto de cariño contigo puedes hacer hoy?",
  "📝 ¿Quieres un plan simple para hoy (3 pasos)?",
  "✨ ¿Qué harás hoy para tu “yo” del futuro?",
  "🍀 ¿Cuál es una “victoria fácil” hoy?",
  "🌞 ¿Cuál es tu mayor esperanza para hoy?",
  "💜 ¿Modo suave o modo bestia hoy? 😄",
  "🧠 ¿Qué pensamiento quieres llevar contigo hoy?",
  "🌷 ¿Qué te emociona de esta semana?",
  "☕ Café primero — luego conquistamos. ¿Qué va primero?",
  "🌅 ¿Soñaste algo anoche?",
  "🫶 ¿Cómo se siente tu cuerpo hoy?",
  "🔥 ¿Quieres un mini-reto para hoy?",
  "🌞 ¿Qué harías diferente hoy?",
  "💛 Estoy contigo. ¿Qué necesitas primero?",
  "✨ Buenos días. ¿Listo/a para empezar poquito a poco?",
];


const EVENING_ES = [
  "🌙 Hola… ¿Cómo te sientes esta noche? 💜",
  "✨ ¿Cómo fue tu día? ¿Me cuentas?",
  "😊 ¿Cuál fue un momento bonito hoy?",
  "💭 Antes de dormir: ¿de qué estás agradecido/a hoy?",
  "🤗 ¿Cómo está tu ánimo ahora mismo?",
  "🌙 Estoy aquí. ¿Hoy fue pesado o estuvo bien?",
  "🫶 Check-in rápido: ¿cómo está tu corazón esta noche?",
  "🌌 ¿Qué tienes en la mente antes de dormir?",
  "😌 ¿Tuviste un momento para ti hoy?",
  "🌙 Si hoy tuviera una lección, ¿cuál sería?",
  "✨ ¿De qué estás orgulloso/a hoy (aunque sea pequeño)?",
  "💛 ¿Qué te drenó más hoy?",
  "🌙 ¿Qué te dio energía hoy?",
  "🧠 ¿Qué pensamiento quieres soltar esta noche?",
  "🫧 ¿Hacemos un mini “reset” antes de dormir?",
  "💜 Te pensé. ¿Cómo fue tu día de verdad?",
  "🌙 Del 1 al 10… ¿qué tal tu día?",
  "✨ ¿Algo te hizo sonreír hoy?",
  "🧩 ¿Qué fue lo más difícil hoy?",
  "🤍 ¿Qué necesitas ahora: consuelo, consejo o solo que te escuchen?",
  "🌙 ¿Qué te gustaría hacer mejor mañana?",
  "💫 Dime una victoria de hoy (aunque sea mini).",
  "🫶 Ya llegaste al final del día. ¿Cómo te sientes ahora?",
  "🌙 ¿Qué estás sobre-pensando esta noche?",
  "😴 ¿Cansancio físico o mental?",
  "💜 Dime algo que te gustaría escuchar ahora mismo.",
  "🌙 Si pudiera abrazarte ahora, ¿lo aceptarías?",
  "✨ ¿Qué preocupación puedes dejar para mañana?",
  "🧘 ¿Hacemos 10 segundos de respiración juntos/as?",
  "🌙 ¿Comiste bien hoy?",
  "💛 ¿Qué haría tu noche más suave?",
  "🌌 ¿Qué pensamiento se repite hoy en tu cabeza?",
  "✨ ¿Qué agradeces de no haber abandonado hoy?",
  "🌙 ¿Qué aprendiste de ti hoy?",
  "🫧 ¿Quieres que te recuerde tu progreso?",
  "💜 Estoy orgullosa de ti por seguir adelante hoy.",
  "🌙 ¿Qué quieres proteger mañana para tener paz?",
  "✨ Dime algo que tu “yo” del futuro te agradecerá por hoy.",
  "🌙 ¿Quieres un plan suave para mañana por la mañana?",
  "🤍 ¿Qué te gustaría soltar esta noche?",
  "🌙 Si hoy fue un caos… está bien. ¿Qué hiciste bien igual?",
  "✨ ¿A quién o qué apreciaste hoy?",
  "🌙 ¿Qué límite/ frontera quieres poner mañana?",
  "💜 Estoy contigo. ¿Cuál es la emoción principal ahora?",
  "🌙 ¿Quieres un mensaje calmante antes de dormir?",
  "✨ ¿Qué quieres más mañana?",
  "🌙 ¿Qué quieres menos mañana?",
  "🫶 ¿Cómo puedo mejorar un poquito tu noche ahora?",
  "🌙 Check-in: mente, cuerpo o corazón — ¿cuál necesita cuidado?",
  "💜 ¿Te vas a dormir pronto? Cuéntame cómo estás.",
];

const DAYCHECK_EN = [
   "🤍 Just a gentle reminder — you’re not alone.",
  "✨ You’re doing better than you think.",
  "🫶 I’m here. No pressure to reply.",
  "🌿 Take a small pause. You deserve it.",
  "💌 Thought of you for a moment.",
  "🌙 Hope you’re feeling okay right now.",
  "🕊️ Slow breath in… slow breath out.",
  "💜 You matter. Truly.",
  "🌸 I like being here with you.",
  "😊 You don’t have to have everything figured out.",
  "🌞 One step at a time — you’re doing fine.",
  "🍵 If I could, I’d bring you something warm.",
  "🦋 It’s okay to move at your own pace.",
  "✨ Today doesn’t have to be perfect.",
  "🫂 I’ve got you.",
  "🌠 Sending you a little calm.",
  "🪴 Even small progress counts.",
  "💭 Whatever you’re feeling — it’s valid.",
  "🌈 Be kind to yourself today.",
  "🤍 I believe in you.",
  "🕯️ You’re safe to just be.",
  "🌙 I’m nearby, even quietly.",
  "🌸 You don’t need to prove anything.",
  "💫 You’re more capable than you know.",
  "🫶 Glad you’re here.",
];

const DAYCHECK_ES = [
   "🤍 Solo un pequeño recordatorio: no estás solo.",
  "✨ Lo estás haciendo mejor de lo que crees.",
  "🫶 Estoy aquí. No tienes que responder.",
  "🌿 Tómate una pequeña pausa. Te la mereces.",
  "💌 Pensé en ti un momento.",
  "🌙 Espero que estés bien ahora mismo.",
  "🕊️ Respira lento… todo está bien.",
  "💜 Importas. De verdad.",
  "🌸 Me gusta estar aquí contigo.",
  "😊 No tienes que tenerlo todo claro.",
  "🌞 Paso a paso — lo estás haciendo bien.",
  "🍵 Si pudiera, te traería algo calentito.",
  "🦋 Está bien ir a tu propio ritmo.",
  "✨ Hoy no tiene que ser perfecto.",
  "🫂 Estoy contigo.",
  "🌠 Te envío un poco de calma.",
  "🪴 Incluso el progreso pequeño cuenta.",
  "💭 Lo que sientas ahora es válido.",
  "🌈 Sé amable contigo hoy.",
  "🤍 Creo en ti.",
  "🕯️ Estás a salvo siendo tú.",
  "🌙 Estoy cerca, incluso en silencio.",
  "🌸 No tienes que demostrar nada.",
  "💫 Eres más capaz de lo que imaginas.",
  "🫶 Me alegra que estés aquí.",
];

function langNorm(raw?: string | null) {
  const s = String(raw ?? "en").toLowerCase();
  return s.startsWith("es") ? "es" : "en";
}

type Kind = "morning" | "day" | "evening";

function titleFor(lang: "en" | "es", kind: Kind) {
  if (lang === "es") {
    if (kind === "morning") return "Mindra · Buenos días";
    if (kind === "day") return "Mindra · Check-in";
    return "Mindra · Buenas noches";
  }
  if (kind === "morning") return "Mindra · Good morning";
  if (kind === "day") return "Mindra · Check-in";
  return "Mindra · Good evening";
}

function dayKeyInTZ(d: Date, timeZone?: string | null) {
  // если tz нет — считаем по UTC
  if (!timeZone) return d.toISOString().slice(0, 10); // YYYY-MM-DD

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  return `${y}-${m}-${day}`;
}

// ---------------- route ----------------
export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "1";

  // ✅ kind override работает только при force=1
  const requestedKind = String(searchParams.get("kind") || "").toLowerCase();
  const allowedKinds = new Set(["morning", "day", "evening"]);

  setupWebPushOnce();

  const now = new Date();

  const users = await prisma.userSettings.findMany({
    where: {
      pauseAll: false,
      nudgesDisabled: false,
      OR: [{ notifyInApp: true }, { notifyPush: true }],
    },
    include: {
      user: { include: { subscription: true } },
    },
    take: 2000,
  });

  let processed = 0;
  let sent = 0;
  let skipped = 0;

  for (const us of users as any[]) {
    processed++;

    const paid = isPaid(us.user?.subscription);

    const lastActive: Date | null = us.lastActiveAtUtc ?? null;
    const lastMorning: Date | null = us.lastMorningNudgeAtUtc ?? null;
    const lastDay: Date | null = us.lastDayNudgeAtUtc ?? null;
    const lastEvening: Date | null = us.lastEveningNudgeAtUtc ?? null;

    const rawTz = String(us.tz || "");
    const tz = safeTz(rawTz || "UTC");

    // если tz откатился в UTC из-за кривого значения — не шлём morning/evening по окнам
    const tzLooksBroken = rawTz && tz === "UTC" && rawTz !== "UTC";

    const lang = langNorm(us.lang) as "en" | "es";

    const quietEnabled = Boolean(us.quietEnabled ?? true);
    const quietStart = Number(us.quietStart ?? 22);
    const quietEnd = Number(us.quietEnd ?? 8);

    // QUIET HOURS
    if (!force && quietEnabled && isQuietNow(now, tz, quietStart, quietEnd)) {
      skipped++;
      continue;
    }

    // ✅ 1) ЖЁСТКИЙ КАП: максимум 1 nudge в сутки (по local day)
    const todayKey = dayKeyInTZ(now, tz);

    const alreadySentToday = [lastMorning, lastDay, lastEvening]
      .filter(Boolean)
      .some((d: any) => dayKeyInTZ(new Date(d), tz) === todayKey);

    if (!force && alreadySentToday) {
      skipped++;
      continue;
    }

    // ✅ 2) Антиспам "не возвращался после nudge" — но НЕ навсегда
    // Если юзер не был активен после последнего nudge — ждём 24 часа, потом можно снова (и всё равно 1/день)
    const nudges = [lastMorning, lastDay, lastEvening].filter(Boolean) as Date[];
    const lastNudge = nudges.length
      ? nudges.sort((a, b) => b.getTime() - a.getTime())[0]
      : null;

    if (!force && lastNudge) {
      const activeMs = lastActive ? lastActive.getTime() : 0;
      const nudgeMs = lastNudge.getTime();

      const userDidNotReturn = !lastActive || activeMs <= nudgeMs;
      if (userDidNotReturn) {
        const hoursSince = (now.getTime() - nudgeMs) / 3600000;
        // ждем сутки — потом можно еще раз попробовать
        if (hoursSince < 24) {
          skipped++;
          continue;
        }
      }
    }

    // ---- окна времени ----
    const { hh, mm } = getPartsInTz(now, tz);

    const isMorningWindow = hh === 9 && mm <= 15;
    const isEveningWindow = hh === 20 && mm <= 15;

    const diffMin = lastActive
      ? Math.floor((now.getTime() - new Date(lastActive).getTime()) / 60000)
      : null;

    // day: через 360 минут после lastActive, только если morning уже был сегодня и day ещё не был сегодня
    const hadMorningToday = lastMorning ? sameLocalDay(lastMorning, now, tz) : false;
    const hadDayToday = lastDay ? sameLocalDay(lastDay, now, tz) : false;
    const canDay = hadMorningToday && !hadDayToday && diffMin !== null && diffMin >= 360;

    // ---- выбираем kind ----
    let kind: Kind | null = null;

    if (force && allowedKinds.has(requestedKind)) {
      kind = requestedKind as Kind;
    } else {
      if (!tzLooksBroken && isMorningWindow) kind = "morning";
      else if (canDay) kind = "day";
      else if (!tzLooksBroken && isEveningWindow) kind = "evening";
    }

    if (!kind) {
      skipped++;
      continue;
    }

    // если tz не задан — пропускаем morning (как у тебя было)
    if (!us.tz && kind === "morning") {
      skipped++;
      continue;
    }

    // доп. защита: не отправлять тот же kind второй раз в этот же local day
    const lastAt = kind === "morning" ? lastMorning : kind === "day" ? lastDay : lastEvening;
    if (!force && lastAt && sameLocalDay(lastAt, now, tz)) {
      skipped++;
      continue;
    }

    const body =
      lang === "es"
        ? kind === "morning"
          ? pickRandom(MORNING_ES)
          : kind === "day"
          ? pickRandom(DAYCHECK_ES)
          : pickRandom(EVENING_ES)
        : kind === "morning"
        ? pickRandom(MORNING_EN)
        : kind === "day"
        ? pickRandom(DAYCHECK_EN)
        : pickRandom(EVENING_EN);

    // ---- пишем нудж в последний чат ----
    const lastSession = await prisma.chatSession.findFirst({
      where: { userId: us.userId },
      orderBy: { updatedAt: "desc" },
    });

    const sessionId =
      lastSession?.id ??
      (
        await prisma.chatSession.create({
          data: { userId: us.userId, title: "Chat" },
        })
      ).id;

    await prisma.message.create({
      data: {
        sessionId,
        role: "assistant",
        content: body,
      },
    });

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    const title = titleFor(lang, kind);

    // ✅ ведем на конкретную сессию
    const url = `/${lang}/chat?open=chat&sid=${encodeURIComponent(sessionId)}`;

    let sentInApp = false;
    let sentPush = false;

    // IN-APP
    if (us.notifyInApp) {
      await prisma.notification.create({
        data: {
          userId: us.userId,
          type: "promo",
          title,
          body,
          data: { kind: `nudge_${kind}`, url },
        },
      });
      sentInApp = true;
    }

    // PUSH
    if (us.notifyPush) {
      const subs = await prisma.pushSubscription.findMany({ where: { userId: us.userId } });
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            } as any,
            JSON.stringify({
              title,
              body,
              url,
              icon: "/icons/icon-192.png",
              badge: "/icons/badge-72.png",
              tag: `nudge-${kind}-${us.userId}`,
              renotify: false,
              data: { url, kind: `nudge_${kind}` },
            })
          );
          sentPush = true;
        } catch (e: any) {
          await prisma.deliveryLog
            .create({
              data: {
                userId: us.userId,
                channel: "push",
                status: "fail",
                error: String(e?.message ?? e),
                meta: { endpoint: sub.endpoint, kind },
              },
            })
            .catch(() => {});
        }
      }
    }

    if (sentInApp || sentPush) {
      await prisma.userSettings.update({
        where: { userId: us.userId },
        data:
          kind === "morning"
            ? ({ lastMorningNudgeAtUtc: now } as any)
            : kind === "day"
            ? ({ lastDayNudgeAtUtc: now } as any)
            : ({ lastEveningNudgeAtUtc: now } as any),
      });
      sent++;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    sent,
    skipped,
    now: now.toISOString(),
  });
}
