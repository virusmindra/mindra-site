// src/lib/mindra/followUps.ts

type Lang = "en" | "es";

/** Храним историю последних N ключей, чтобы не повторяться */
function loadRecent(uid: string, lang: Lang) {
  try {
    const raw = localStorage.getItem(`mindra_fu_recent:${uid}:${lang}`) || "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRecent(uid: string, lang: Lang, arr: string[]) {
  try {
    localStorage.setItem(`mindra_fu_recent:${uid}:${lang}`, JSON.stringify(arr.slice(0, 20)));
  } catch {}
}

/** Выбор случайного элемента с бан-листом */
function pickOne<T>(arr: T[], avoid: Set<number>) {
  if (!arr.length) return null;
  const idxs = arr.map((_, i) => i).filter((i) => !avoid.has(i));
  const pool = idxs.length ? idxs : arr.map((_, i) => i);
  const idx = pool[Math.floor(Math.random() * pool.length)];
  return { idx, value: arr[idx] };
}

/** Утилита: небольшая вариативность окончания */
function softTagEN() {
  const a = ["🤍", "🙂", "🫶", "🌿", "✨", "💜"];
  return a[Math.floor(Math.random() * a.length)];
}
function softTagES() {
  const a = ["🤍", "🙂", "🫶", "🌿", "✨", "💜"];
  return a[Math.floor(Math.random() * a.length)];
}

/**
 * Ключи событий (evKey) — лучше держать “короткими и стабильными”.
 * Твоё сохранение события может писать: evKey="job_lost" category="work" summary="..."
 */
const FOLLOWUPS: Record<Lang, Record<string, string[]>> = {
  en: {
    // --- family / relationships ---
    reconciled_father: [
      "You told me you made peace with your dad… how are things between you two now? 🤍",
      "Hey… any update on you and your dad after that talk? I’m rooting for you. 🤍",
      "How’s it been with your dad lately? Even small progress counts. 🫶",
      "Did things stay calm with your dad after you reconciled? I’m here. 🌿",
    ],
    relationship_tension: [
      "You mentioned some tension in your relationship… how’s it feeling today? 🤍",
      "Checking in — did things get any softer between you two? 🫶",
      "How are things with your partner now? One step at a time. 🌿",
      "Do you feel more understood today than you did before? 🤍",
    ],
    breakup: [
      "Hey… how are you holding up after that breakup? 🤍",
      "Just a gentle check-in — how’s your heart today? 🫶",
      "Did you manage to rest a little after everything that happened? 🌿",
      "What’s the hardest moment of the day lately? I’m here. 🤍",
    ],
    crush: [
      "So… how’s that person you told me about? Any new vibes? 🙂",
      "Did you talk to them again? I’m curious (in a good way). ✨",
      "How are you feeling about your crush today — more calm or more excited? 🙂",
      "Any little sign from them lately? 👀🙂",
    ],
    lonely: [
      "Hey… you crossed my mind. How are you feeling today — less alone? 🤍",
      "Mini check-in: how’s your inner world today? I’m here. 🫶",
      "Did you get at least one warm moment today? 🌿",
      "If today feels heavy — tell me what’s on your mind. 🤍",
    ],

    // --- work / money ---
    fired_job: [
      "You mentioned the job situation… how are you holding up now? Any next step already?",
      "How’s the work search going? Even one small action is progress. 🤍",
      "Have you had any new opportunities since we talked about your job? 🌿",
      "Did you manage to update your resume / apply somewhere? If not — no guilt. 🤍",
    ],
    job_interview: [
      "Hey — how did that interview go? I’m proud you showed up. 🙂",
      "Any news after your interview? Fingers crossed for you. 🤍",
      "How do you feel about the interview now — more confident? ✨",
      "Did they reply yet? Even waiting takes strength. 🤍",
    ],
    salary_raise: [
      "You were aiming for a raise… any update? You deserve good things. ✨",
      "How’s that money goal going — any progress lately? 💸🙂",
      "Did you take any step toward that raise/promotion? 🤍",
      "If you want, we can plan the next move for your career. 🌿",
    ],
    money_stress: [
      "Hey… how’s the money stress today? A little lighter or still heavy? 🤍",
      "Just checking in — did you manage to feel safer about finances today? 🌿",
      "Want to do a tiny plan for this week so it feels less overwhelming? 🤍",
      "Have you had at least one small win with money lately? 💜",
    ],

    // --- study / growth ---
    passed_exam: [
      "Hey, how did you feel after that exam result? You deserved that win 🙂",
      "Still proud of you for that exam. How’s your motivation today? ✨",
      "Did you celebrate your win even a little? You should. 🙂",
      "What’s the next thing you want to improve after that success? 🌿",
    ],
    study_stress: [
      "How’s studying feeling today — a bit easier or still intense? 🤍",
      "Did you manage to focus at least for a short time today? That counts. 🙂",
      "Want to set a tiny study plan for the next 24 hours? 🌿",
      "How’s your energy for learning today? 🤍",
    ],

    // --- health / body ---
    started_gym: [
      "You were getting back to the gym… how did it go lately? 💪🙂",
      "Any movement progress? Even a short workout is a win. 🤍",
      "How’s your body feeling after training — better, tired, proud? 🙂",
      "Did you keep the gym rhythm? If not — we restart gently. 🌿",
    ],
    sleep_issues: [
      "How was your sleep lately? Any night a bit better? 🌙🤍",
      "Did you manage to rest at all? I care about you. 🌿",
      "Are you sleeping closer to the schedule you wanted? 🤍",
      "Want a tiny bedtime ritual for tonight? 🌙🙂",
    ],
    anxiety: [
      "Hey… how’s your anxiety today — lighter or still strong? 🤍",
      "Did you get at least one calm moment today? 🫶",
      "If you want, tell me what triggered it — we’ll soften it together. 🌿",
      "Just checking in… are you feeling safer right now? 🤍",
    ],
    illness: [
      "How are you feeling physically today? Any improvement? 🤍",
      "Did you manage to take care of yourself a bit — water, rest? 🌿",
      "Is your body feeling kinder today? I’m here. 🫶",
      "What would make today 5% easier for you? 🤍",
    ],

    // --- social / life events ---
    moved_city: [
      "How’s the new place feeling today — more like home? 🏡🤍",
      "Any new discoveries in your new area? ✨",
      "Did you settle a bit more since moving? 🌿",
      "What’s one thing you like about the new place so far? 🙂",
    ],
    conflict_friend: [
      "How’s it going with that friend situation now? 🤍",
      "Did things cool down a bit with your friend? 🌿",
      "Want to talk through what to say next time? 🫶",
      "Do you feel more at peace about it today? 🤍",
    ],
    big_win: [
      "Hey, you had that win… do you still feel proud today? ✨",
      "How’s your mood after that success — still glowing? 🙂",
      "Did you share your win with someone you trust? 🤍",
      "What do you want to do next after that momentum? 🚀",
    ],

    // --- generic fallback ---
    default: [
      "Hey… quick check-in: how are things going with what you told me earlier? 🤍",
      "Mini check-in — how’s that situation feeling today? 🌿",
      "How are you doing with that thing we talked about? One honest sentence. 🤍",
      "Just checking in on you. How’s your heart today? 🫶",
      "Did anything change since the last time we talked about it? 🙂",
    ],
  },

  es: {
    reconciled_father: [
      "Me dijiste que arreglaste las cosas con tu papá… ¿cómo van ahora? 🤍",
      "Hey… ¿cómo está la relación con tu papá después de esa charla? 🫶",
      "¿Se mantuvo la calma entre ustedes? Incluso un pequeño avance cuenta. 🌿",
      "¿Cómo te sientes hoy con el tema de tu papá? Estoy contigo. 🤍",
    ],
    relationship_tension: [
      "Mencionaste tensión en tu relación… ¿cómo se siente hoy? 🤍",
      "Mini check-in — ¿las cosas están un poco más suaves entre ustedes? 🫶",
      "¿Cómo van tú y tu pareja ahora? Paso a paso. 🌿",
      "¿Te sientes más comprendido(a) hoy? 🤍",
    ],
    breakup: [
      "Hey… ¿cómo estás llevando esa ruptura? 🤍",
      "Solo un check-in suave… ¿cómo está tu corazón hoy? 🫶",
      "¿Pudiste descansar un poquito después de todo? 🌿",
      "¿Cuál es el momento más difícil del día últimamente? Estoy aquí. 🤍",
    ],
    crush: [
      "Entonces… ¿qué tal esa persona que me contaste? ¿Algo nuevo? 🙂",
      "¿Volviste a hablar con esa persona? Tengo curiosidad (bonita). ✨",
      "¿Cómo te sientes hoy con tu crush — más tranquilo(a) o más emocionado(a)? 🙂",
      "¿Alguna señal de esa persona últimamente? 👀🙂",
    ],
    lonely: [
      "Hey… pensé en ti. ¿Te sientes menos solo(a) hoy? 🤍",
      "Mini check-in: ¿cómo está tu mundo interior hoy? 🫶",
      "¿Tuviste хотя sea un momento cálido hoy? 🌿",
      "Si hoy pesa… cuéntame qué tienes en la mente. 🤍",
    ],

    fired_job: [
      "Sobre el tema del trabajo… ¿cómo estás hoy? ¿Ya pensaste en el siguiente paso?",
      "¿Cómo va la búsqueda? Un paso pequeño también es progreso. 🤍",
      "¿Ha aparecido alguna oportunidad nueva desde que hablamos? 🌿",
      "¿Pudiste actualizar el CV o postular a algo? Sin culpa si no. 🤍",
    ],
    job_interview: [
      "Hey — ¿cómo fue esa entrevista? Estoy orgullosa de ti. 🙂",
      "¿Alguna noticia después de la entrevista? 🤍",
      "¿Cómo te sientes ahora — más seguro(a)? ✨",
      "¿Ya te respondieron? Incluso esperar requiere fuerza. 🤍",
    ],
    salary_raise: [
      "Querías un aumento… ¿alguna novedad? Te lo mereces. ✨",
      "¿Cómo va tu meta de dinero — algún progreso? 💸🙂",
      "¿Diste algún paso hacia ese ascenso/aumento? 🤍",
      "Si quieres, planeamos el siguiente movimiento juntos. 🌿",
    ],
    money_stress: [
      "Hey… ¿cómo está el estrés por dinero hoy — un poco más ligero? 🤍",
      "Check-in: ¿te sentiste más seguro(a) con las finanzas hoy? 🌿",
      "¿Hacemos un mini plan para esta semana para que pese menos? 🤍",
      "¿Tuviste хотя sea una pequeña victoria con el dinero? 💜",
    ],

    passed_exam: [
      "¿Cómo te sentiste con ese resultado? Te lo merecías 🙂",
      "Sigo orgullosa de ti por ese examen. ¿Cómo está tu motivación hoy? ✨",
      "¿Lo celebraste хотя sea un poquito? Deberías. 🙂",
      "¿Qué quieres mejorar después de esa victoria? 🌿",
    ],
    study_stress: [
      "¿Cómo se siente estudiar hoy — más fácil o intenso? 🤍",
      "¿Pudiste concentrarte хотя sea un ratito? Eso cuenta. 🙂",
      "¿Quieres un mini plan de estudio para las próximas 24 horas? 🌿",
      "¿Cómo está tu energía para aprender hoy? 🤍",
    ],

    started_gym: [
      "Volvías al gym… ¿qué tal te fue últimamente? 💪🙂",
      "¿Algún progreso con el movimiento? Un entrenamiento corto ya es victoria. 🤍",
      "¿Cómo se siente tu cuerpo después de entrenar — mejor, cansado, orgulloso(a)? 🙂",
      "¿Mantuviste el ritmo? Si no — reiniciamos suave. 🌿",
    ],
    sleep_issues: [
      "¿Qué tal tu sueño últimamente? ¿Alguna noche un poco mejor? 🌙🤍",
      "¿Pudiste descansar? Me importas. 🌿",
      "¿Duermes más cerca del horario que querías? 🤍",
      "¿Quieres un ritual cortito para dormir hoy? 🌙🙂",
    ],
    anxiety: [
      "Hey… ¿cómo está tu ansiedad hoy — más ligera o fuerte? 🤍",
      "¿Tuviste хоча sea un momento de calma hoy? 🫶",
      "Si quieres, dime qué lo activó — lo suavizamos juntos. 🌿",
      "Solo un check-in… ¿te sientes más seguro(a) ahora? 🤍",
    ],
    illness: [
      "¿Cómo te sientes físicamente hoy? ¿Algo mejor? 🤍",
      "¿Pudiste cuidarte un poquito — agua, descanso? 🌿",
      "¿Tu cuerpo está un poco más amable hoy? 🫶",
      "¿Qué haría hoy 5% más fácil para ti? 🤍",
    ],

    moved_city: [
      "¿Cómo se siente el nuevo lugar hoy — más como hogar? 🏡🤍",
      "¿Descubriste algo nuevo por ahí? ✨",
      "¿Te acomodaste un poco más desde la mudanza? 🌿",
      "¿Qué es lo que más te gusta del nuevo lugar hasta ahora? 🙂",
    ],
    conflict_friend: [
      "¿Cómo va la situación con esa amistad ahora? 🤍",
      "¿Se calmó un poco el tema con tu amigo(a)? 🌿",
      "¿Quieres pensar juntos qué decir la próxima vez? 🫶",
      "¿Te sientes más en paz hoy con eso? 🤍",
    ],
    big_win: [
      "Hey, tuviste esa victoria… ¿todavía te sientes orgulloso(a) hoy? ✨",
      "¿Cómo está tu ánimo después del éxito — todavía brillando? 🙂",
      "¿Compartiste tu logro con alguien de confianza? 🤍",
      "¿Qué quieres hacer ahora con ese impulso? 🚀",
    ],

    default: [
      "Mini check-in: ¿cómo va eso que me contaste el otro día? 🤍",
      "Solo quería saber… ¿cómo se siente hoy esa situación? 🌿",
      "¿Cómo vas con eso que hablamos? Una frase honesta. 🤍",
      "Estoy aquí contigo. ¿Cómo está tu corazón hoy? 🫶",
      "¿Cambió algo desde la última vez que hablamos? 🙂",
    ],
  },
};

/**
 * Главная функция.
 * evKey — ключ события (например "fired_job")
 * uid — чтобы не повторять одно и то же пользователю
 */
export function buildFollowUp(evKey: string, lang: Lang, uid: string) {
  const dict = FOLLOWUPS[lang] || FOLLOWUPS.en;
  const list = dict[evKey] || dict.default || [];
  if (!list.length) return lang === "es"
    ? `Mini check-in… ¿cómo vas hoy? ${softTagES()}`
    : `Mini check-in… how are you today? ${softTagEN()}`;

  const recent = loadRecent(uid, lang);
  // избегаем последние 2–3 сообщения по этому же ключу
  const avoid = new Set<number>();
  // чуть сильнее: если последние msg совпадали текстом — избегаем именно этот idx
  // (простая логика: запоминаем "evKey|idx")
  const avoidPairs = new Set(recent.slice(0, 5));
  for (let i = 0; i < list.length; i++) {
    if (avoidPairs.has(`${evKey}|${i}`)) avoid.add(i);
  }

  const picked = pickOne(list, avoid);
  const idx = picked?.idx ?? 0;
  const text = String(picked?.value ?? list[0]);

  const nextRecent = [`${evKey}|${idx}`, ...recent].slice(0, 20);
  saveRecent(uid, lang, nextRecent);

  return text;
}
