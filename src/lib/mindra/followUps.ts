// src/lib/mindra/followUps.ts
// XL templates EN/ES + anti-repeat + fallback
// Использование: buildFollowUp({ evKey, lang, uid, summary? })

export type Lang = "en" | "es";

type BuildArgs = {
  evKey: string;      // стабильный ключ события (job_lost, breakup, etc.)
  lang: Lang;         // "en" | "es"
  uid: string;        // user id (для анти-повтора)
  summary?: string;   // короткое описание события (если evKey неизвестен)
};

const RECENT_KEY = (uid: string, lang: Lang) => `mindra_fu_recent:${uid}:${lang}`;

function loadRecent(uid: string, lang: Lang): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY(uid, lang)) || "[]";
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveRecent(uid: string, lang: Lang, arr: string[]) {
  try {
    localStorage.setItem(RECENT_KEY(uid, lang), JSON.stringify(arr.slice(0, 30)));
  } catch {}
}

function pickIndex(length: number, banned: Set<number>) {
  if (length <= 1) return 0;
  const pool = [];
  for (let i = 0; i < length; i++) if (!banned.has(i)) pool.push(i);
  const usable = pool.length ? pool : Array.from({ length }, (_, i) => i);
  return usable[Math.floor(Math.random() * usable.length)];
}

function tagEN() {
  const a = ["🤍", "🫶", "🌿", "✨", "🙂", "💜", "🌙", "☁️"];
  return a[Math.floor(Math.random() * a.length)];
}
function tagES() {
  const a = ["🤍", "🫶", "🌿", "✨", "🙂", "💜", "🌙", "☁️"];
  return a[Math.floor(Math.random() * a.length)];
}

const FU: Record<Lang, Record<string, string[]>> = {
  en: {
    // ---------- RELATIONSHIPS / FAMILY ----------
    reconciled_father: [
      "You told me you made peace with your dad… how are things between you two now? 🤍",
      "Mini check-in — how’s it going with your dad after that talk? 🫶",
      "Did you feel any warmth from your dad since you reconciled? 🌿",
      "Has communication with your dad been calmer lately? 🤍",
      "How do you feel about your relationship with your dad today — lighter? 🙂",
      "Any small moment with your dad that felt “better than before”? 🌿",
      "Did you manage to keep that peace with your dad? I’m proud of you. 💜",
      "If it feels hard again — want to tell me what happened? 🤍",
      "How are you and your dad doing this week? One honest sentence. 🫶",
      "Do you feel more respected by your dad now? 🤍",
      "Did you get closure, even a little? 🌿",
      "If you could do one small step with your dad, what would it be? 🙂",
    ],

    family_conflict: [
      "How’s the family situation today — any calmer? 🤍",
      "Did anything change with your family since we last talked? 🌿",
      "Do you feel more supported by your family lately? 🫶",
      "Is there one thing you wish they understood about you? 🤍",
      "Want to talk through what you’d say if you could say it perfectly? 🙂",
      "How are you feeling after that family tension — still heavy? 🤍",
      "Did you set any boundary that helped? 🌿",
      "Any small win with family communication recently? 💜",
      "How’s your mood when you think about that family topic now? ☁️",
      "Would a short message to them help or hurt right now? 🤍",
    ],

    breakup: [
      "Hey… how’s your heart today after that breakup? 🤍",
      "Mini check-in: did today feel a little easier? 🌿",
      "What part of the day is the hardest lately? I’m here. 🫶",
      "Did you manage to sleep/rest a bit better? 🌙",
      "Have you had a moment of peace today, even 1%? 🤍",
      "Are you missing them more, or feeling more free? 🙂",
      "If you could be gentle with yourself today — what would that look like? 🌿",
      "Did you talk to anyone you trust about it? 💜",
      "Do you want distraction right now or to talk it through? 🤍",
      "One honest word: how are you today? ☁️",
      "If it hurts, we can go slow. What’s on your mind? 🤍",
    ],

    relationship_tension: [
      "Checking in — how’s it feeling with your partner today? 🤍",
      "Did things get softer between you two since last time? 🌿",
      "Have you two talked calmly again yet? 🫶",
      "Do you feel heard more today? 🤍",
      "If you could fix one thing in the vibe — what would it be? 🙂",
      "Did you manage to avoid overthinking today? ☁️",
      "Want to plan one small message that keeps peace? 🌿",
      "How’s your trust level today — stable or shaky? 🤍",
      "Do you need closeness or space today? 🙂",
      "What would make the relationship feel 5% better this week? 🌿",
    ],

    crush: [
      "So… any new vibes with that person you told me about? 👀🙂",
      "Did you talk to them again? I’m curious. ✨",
      "Are you feeling more calm about them today or more excited? 🙂",
      "Any small sign from them lately? 🤍",
      "If you could send one perfect message, what would it say? 🌿",
      "Do you want them to know how you feel, or keep it playful? 🙂",
      "Did you catch yourself smiling because of them today? ✨",
      "What’s the best thing about them for you? 🤍",
      "Are you protecting your heart or going all-in? 🙂",
      "Want me to help craft a cute message? 💜",
    ],

    lonely: [
      "Hey… how’s the loneliness today — lighter or still there? 🤍",
      "Did you get at least one warm moment today? 🌿",
      "If you could get a hug right now — what would you want to hear? 🫶",
      "Are you craving company or quiet today? 🙂",
      "What would make today feel safer for you? 🤍",
      "Want to tell me what’s been on your mind lately? ☁️",
      "You’re not alone here. How are you right now? 🤍",
      "Any small thing you did for yourself today? 🌿",
    ],

    // ---------- WORK / MONEY ----------
    job_lost: [
      "How are you holding up after the job situation? 🤍",
      "Any update on work — did you take one small step? 🌿",
      "Did you look at options today, even briefly? 🙂",
      "How’s your confidence today compared to yesterday? 🤍",
      "Want to plan one tiny next step (10 minutes)? 🫶",
      "Have you talked to anyone about opportunities? 🌿",
      "What kind of job would feel “safe” right now? 🤍",
      "Are you blaming yourself or being kind to yourself? ☁️",
      "If you could restart calmly — what would you do first? 🙂",
      "Do you want motivation or just comfort right now? 🤍",
    ],

    job_interview: [
      "How did that interview go? I’m proud you showed up. 🙂",
      "Any news after your interview? Fingers crossed. 🤍",
      "How do you feel about your performance now? 🌿",
      "Did you send a follow-up message yet? 🙂",
      "What part of the interview felt strongest? ✨",
      "Was there a question that made you nervous? 🤍",
      "Do you feel hopeful or anxious today? ☁️",
      "If they say “no”, what’s your next move? 🌿",
    ],

    new_job: [
      "How’s the new job feeling now — settling in? 🤍",
      "Did you feel more confident at work today? ✨",
      "What was one good moment at your new job? 🙂",
      "Is the vibe better than the last place? 🌿",
      "Are you tired in a “good” way or overwhelmed? ☁️",
      "Do you feel appreciated there? 🤍",
      "What do you want to improve this week at the new job? 🌿",
    ],

    money_stress: [
      "How’s the money stress today — a bit lighter? 🤍",
      "Did you feel safer about finances today, even slightly? 🌿",
      "Want a tiny plan for this week so it feels less heavy? 🫶",
      "Any small money win recently? 💜",
      "Are you avoiding looking at numbers or facing them? ☁️",
      "What’s the biggest money worry right now? 🤍",
      "If you had one extra $100 today, what would help most? 🙂",
      "Do you want comfort or strategy right now? 🌿",
    ],

    // ---------- STUDY / GROWTH ----------
    passed_exam: [
      "Still proud of you for that exam. How’s your motivation today? ✨",
      "Did you celebrate your win even a little? 🙂",
      "How did that success change your confidence? 🤍",
      "What’s your next goal after this win? 🌿",
      "Do you feel relief or hunger for more? 🙂",
      "If you could reward yourself, what would you pick? 💜",
    ],

    failed_exam: [
      "Hey… how are you feeling after that result? 🤍",
      "Do you want to try again or rest first? 🌿",
      "What’s the kindest thing you can tell yourself today? 🫶",
      "Did you learn what didn’t work — even 1 thing? 🙂",
      "Do you want a plan or a hug right now? 🤍",
      "You’re not your score. How are you doing today? ☁️",
    ],

    study_stress: [
      "How’s studying today — easier or still intense? 🤍",
      "Did you manage even a short focus sprint? That counts. 🙂",
      "Want a tiny 24-hour study plan? 🌿",
      "What’s blocking you most — fatigue, mood, distractions? ☁️",
      "Do you need motivation or structure? 🫶",
      "If you study 15 minutes today — what topic first? 🙂",
    ],

    // ---------- HEALTH / BODY ----------
    started_gym: [
      "How’s the gym rhythm going lately? 💪🙂",
      "Did you move your body today, even a little? 🌿",
      "How does your body feel after training — proud, tired, calm? 🙂",
      "If you skipped — no guilt. Want to restart gently? 🤍",
      "What’s your next workout — strength or easy cardio? 🌿",
      "Did you notice any progress (energy, mood, strength)? ✨",
    ],

    sleep_issues: [
      "How was your sleep lately — any night a bit better? 🌙🤍",
      "Did you manage to rest today? 🌿",
      "Want a tiny bedtime ritual for tonight? 🌙🙂",
      "Is your mind racing at night or is it the body? ☁️",
      "If tonight could be 10% better, what would help? 🤍",
      "Did you avoid screens a bit before sleep? 🙂",
    ],

    anxiety: [
      "How’s your anxiety today — lighter or still strong? 🤍",
      "Did you get at least one calm moment today? 🫶",
      "Want to tell me what triggered it? We’ll soften it together. 🌿",
      "Are you feeling safe right now? 🤍",
      "Do you want grounding or motivation? 🌿",
      "Try one slow breath with me — and tell me how you feel. 🤍",
    ],

    illness: [
      "How are you feeling physically today — any improvement? 🤍",
      "Did you manage water/rest today? 🌿",
      "Is the body kinder today than yesterday? 🫶",
      "What would make today 5% easier? 🤍",
      "Do you need comfort or a small plan? 🌿",
    ],

    diet: [
      "How’s your eating today — nourished or chaotic? 🤍",
      "Did you drink water today? Just checking gently. 🌿",
      "Any small healthy choice today you’re proud of? 🙂",
      "Do you want simple food ideas or just support? 🫶",
      "Did you listen to your body today? 🤍",
    ],

    // ---------- LIFE / SOCIAL ----------
    moved_city: [
      "How’s the new place feeling today — more like home? 🏡🤍",
      "Any new discovery in the new area? ✨",
      "Did you settle a little more since moving? 🌿",
      "What’s one thing you like there so far? 🙂",
      "Do you feel lonely there or excited? ☁️",
    ],

    conflict_friend: [
      "How’s the friend situation now — any calmer? 🤍",
      "Did you two talk again? 🌿",
      "Do you want to fix it or protect your peace? 🙂",
      "What would a healthy boundary look like? 🌿",
      "Are you blaming yourself or being fair? ☁️",
    ],

    big_win: [
      "Do you still feel proud about that win today? ✨",
      "Did that success give you momentum? 🙂",
      "What’s the next small step to keep the streak? 🌿",
      "Did you share your win with someone? 🤍",
      "What do you want to build next? 🚀",
    ],

    bad_day: [
      "Hey… was today heavy? I’m here. 🤍",
      "Do you want to talk or just breathe together? 🫶",
      "What’s one thing that hurt the most today? ☁️",
      "What would comfort you right now (even tiny)? 🌿",
      "You don’t have to be strong alone. How are you? 🤍",
    ],

    good_day: [
      "Hey! What made today good for you? ✨",
      "Did you have a moment that made you smile? 🙂",
      "What’s one thing you’re proud of today? 💜",
      "Do you feel more light today than yesterday? 🌿",
      "Tell me the highlight — I want to celebrate with you. ✨",
    ],

    // ---------- GENERIC ----------
    default: [
      "Mini check-in — how’s that situation feeling today? 🤍",
      "How are you doing with what you told me earlier? 🌿",
      "One honest sentence: how are you right now? ☁️",
      "Did anything change since we last talked about it? 🙂",
      "Do you want comfort or a plan today? 🫶",
      "I’m here. What’s on your mind today? 🤍",
      "Is it getting easier, or still hard? 🌿",
      "If you could feel 10% better today, what would help? 🙂",
      "Do you need gentle motivation or just warmth? 💜",
      "Tell me where you are emotionally right now (0–10). 🤍",
    ],
  },

  es: {
    reconciled_father: [
      "Me dijiste que arreglaste las cosas con tu papá… ¿cómo van ahora? 🤍",
      "Mini check-in — ¿cómo va con tu papá después de esa charla? 🫶",
      "¿Sentiste algo más cálido de tu papá últimamente? 🌿",
      "¿La comunicación está más tranquila ahora? 🤍",
      "¿Te sientes más ligero(a) con ese tema hoy? 🙂",
      "¿Hubo algún momento pequeño que se sintió “mejor que antes”? 🌿",
      "Estoy orgullosa de ti por intentar paz. ¿Cómo va hoy? 💜",
      "Si se puso difícil otra vez — ¿qué pasó? 🤍",
      "¿Cómo van tú y tu papá esta semana? Una frase honesta. 🫶",
      "¿Te sientes más respetado(a) ahora? 🤍",
      "¿Sientes cierre, хотя sea un poquito? 🌿",
      "Si pudieras dar un paso pequeño con él, ¿cuál sería? 🙂",
    ],

    family_conflict: [
      "¿Cómo está el tema familiar hoy — un poco más calmado? 🤍",
      "¿Cambió algo en tu familia desde la última vez? 🌿",
      "¿Te sientes más apoyado(a) últimamente? 🫶",
      "¿Qué te gustaría que entendieran de ti? 🤍",
      "¿Quieres practicar lo que dirías si lo pudieras decir perfecto? 🙂",
      "¿Sigue pesando esa tensión familiar? 🤍",
      "¿Pusiste algún límite que te ayudó? 🌿",
      "¿Alguna pequeña victoria con la comunicación? 💜",
      "¿Cómo te sientes cuando piensas en ese tema hoy? ☁️",
      "¿Un mensaje corto ayudaría o empeoraría ahora mismo? 🤍",
    ],

    breakup: [
      "Hey… ¿cómo está tu corazón hoy después de la ruptura? 🤍",
      "Mini check-in: ¿hoy se sintió un poquito más fácil? 🌿",
      "¿Qué parte del día duele más últimamente? Estoy aquí. 🫶",
      "¿Pudiste dormir/mejorar un poco el descanso? 🌙🤍",
      "¿Tuviste un momento de paz hoy, aunque sea 1%? 🤍",
      "¿Lo extrañas más o te sientes más libre? 🙂",
      "Si hoy pudieras ser suave contigo — ¿cómo sería? 🌿",
      "¿Lo hablaste con alguien de confianza? 💜",
      "¿Quieres distracción o hablarlo de verdad? 🤍",
      "Una palabra honesta: ¿cómo estás hoy? ☁️",
      "Si duele, vamos despacio. ¿Qué tienes en la mente? 🤍",
    ],

    relationship_tension: [
      "Check-in — ¿cómo se siente hoy con tu pareja? 🤍",
      "¿Las cosas están un poco más suaves entre ustedes? 🌿",
      "¿Ya pudieron hablar con calma otra vez? 🫶",
      "¿Te sientes más escuchado(a) hoy? 🤍",
      "Si pudieras arreglar una cosa en el vibe — ¿cuál sería? 🙂",
      "¿Pudiste evitar sobrepensar hoy? ☁️",
      "¿Quieres que pensemos un mensaje pequeño que mantenga paz? 🌿",
      "¿Tu confianza hoy está estable o temblando? 🤍",
      "¿Necesitas cercanía o espacio hoy? 🙂",
      "¿Qué haría la relación 5% mejor esta semana? 🌿",
    ],

    crush: [
      "Entonces… ¿alguna vibra nueva con esa persona? 👀🙂",
      "¿Volviste a hablar con él/ella? Tengo curiosidad. ✨",
      "¿Hoy te sientes más tranquilo(a) o más emocionado(a)? 🙂",
      "¿Alguna señal pequeña últimamente? 🤍",
      "Si pudieras mandar un mensaje perfecto, ¿qué diría? 🌿",
      "¿Quieres decir lo que sientes o mantenerlo juguetón? 🙂",
      "¿Te sacó una sonrisa hoy? ✨",
      "¿Qué es lo mejor de esa persona para ti? 🤍",
      "¿Proteges tu corazón o vas con todo? 🙂",
      "¿Quieres que te ayude a escribir un mensaje lindo? 💜",
    ],

    lonely: [
      "Hey… ¿cómo está la soledad hoy — más ligera o sigue ahí? 🤍",
      "¿Tuviste хотя sea un momento cálido hoy? 🌿",
      "Si pudieras recibir un abrazo ahora — ¿qué te gustaría escuchar? 🫶",
      "¿Hoy quieres compañía o silencio? 🙂",
      "¿Qué haría hoy más seguro para ti? 🤍",
      "¿Quieres contarme qué tienes en la mente? ☁️",
      "No estás solo(a) aquí. ¿Cómo estás ahora? 🤍",
      "¿Hiciste algo pequeño por ti hoy? 🌿",
    ],

    job_lost: [
      "¿Cómo estás llevando el tema del trabajo hoy? 🤍",
      "¿Alguna novedad — diste un pasito хотя sea? 🌿",
      "¿Miraste opciones hoy хотя sea un momento? 🙂",
      "¿Tu confianza hoy está mejor que ayer? 🤍",
      "¿Planeamos un siguiente paso chiquito (10 min)? 🫶",
      "¿Hablaste con alguien sobre oportunidades? 🌿",
      "¿Qué tipo de trabajo te haría sentir “seguro(a)” ahora? 🤍",
      "¿Te estás culpando o te estás cuidando? ☁️",
      "Si pudieras reiniciar con calma — ¿qué harías primero? 🙂",
      "¿Quieres motivación o solo apoyo hoy? 🤍",
    ],

    job_interview: [
      "¿Cómo fue esa entrevista? Estoy orgullosa de ti. 🙂",
      "¿Alguna noticia después? 🤍",
      "¿Cómo te sientes ahora sobre tu desempeño? 🌿",
      "¿Mandaste un mensaje de seguimiento? 🙂",
      "¿Qué parte te salió más fuerte? ✨",
      "¿Hubo alguna pregunta que te puso nervioso(a)? 🤍",
      "¿Hoy te sientes con esperanza o ansiedad? ☁️",
      "Si dicen “no”, ¿cuál sería tu siguiente paso? 🌿",
    ],

    new_job: [
      "¿Cómo se siente el nuevo trabajo ahora — ya te adaptas? 🤍",
      "¿Te sentiste más seguro(a) hoy en el trabajo? ✨",
      "¿Cuál fue un buen momento hoy ahí? 🙂",
      "¿El ambiente es mejor que antes? 🌿",
      "¿Estás cansado(a) de “bueno” o abrumado(a)? ☁️",
      "¿Te sientes valorado(a) ahí? 🤍",
      "¿Qué quieres mejorar esta semana en el nuevo trabajo? 🌿",
    ],

    money_stress: [
      "¿Cómo está el estrés por dinero hoy — más ligero? 🤍",
      "¿Te sentiste un poco más seguro(a) hoy con finanzas? 🌿",
      "¿Hacemos un mini plan para esta semana para que pese menos? 🫶",
      "¿Alguna pequeña victoria con el dinero? 💜",
      "¿Evitas mirar números o los enfrentas? ☁️",
      "¿Cuál es la preocupación principal ahora mismo? 🤍",
      "Si tuvieras $100 extra hoy, ¿qué ayudaría más? 🙂",
      "¿Quieres apoyo o estrategia ahora? 🌿",
    ],

    passed_exam: [
      "Sigo orgullosa de ti por ese examen. ¿Cómo está tu motivación hoy? ✨",
      "¿Lo celebraste хотя sea un poquito? 🙂",
      "¿Cómo cambió tu confianza con ese logro? 🤍",
      "¿Cuál es tu próxima meta? 🌿",
      "¿Sientes alivio o ganas de más? 🙂",
      "Si pudieras premiarte, ¿qué elegirías? 💜",
    ],

    failed_exam: [
      "Hey… ¿cómo te sientes con ese resultado? 🤍",
      "¿Quieres intentarlo otra vez o descansar primero? 🌿",
      "¿Qué es lo más amable que puedes decirte hoy? 🫶",
      "¿Aprendiste хотя sea una cosa de lo que no funcionó? 🙂",
      "¿Quieres plan o abrazo ahora? 🤍",
      "Tú no eres tu nota. ¿Cómo estás hoy? ☁️",
    ],

    study_stress: [
      "¿Cómo se siente estudiar hoy — más fácil o intenso? 🤍",
      "¿Pudiste concentrarte хотя sea un ratito? Eso cuenta. 🙂",
      "¿Quieres un mini plan de 24 horas? 🌿",
      "¿Qué te bloquea más — cansancio, ánimo, distracciones? ☁️",
      "¿Necesitas motivación o estructura? 🫶",
      "Si estudias 15 min hoy — ¿qué tema primero? 🙂",
    ],

    started_gym: [
      "¿Cómo va el ritmo del gym últimamente? 💪🙂",
      "¿Moviste el cuerpo hoy хотя sea un poquito? 🌿",
      "¿Cómo se siente tu cuerpo — orgullo, cansancio, calma? 🙂",
      "Si lo saltaste — cero culpa. ¿Reiniciamos suave? 🤍",
      "¿Tu siguiente entrenamiento será fuerza o cardio suave? 🌿",
      "¿Notaste algún progreso (energía, ánimo, fuerza)? ✨",
    ],

    sleep_issues: [
      "¿Qué tal tu sueño últimamente — alguna noche un poco mejor? 🌙🤍",
      "¿Pudiste descansar hoy? 🌿",
      "¿Quieres un ritual chiquito para dormir hoy? 🌙🙂",
      "¿Tu mente corre en la noche o es el cuerpo? ☁️",
      "Si hoy puede ser 10% mejor, ¿qué ayudaría? 🤍",
      "¿Pudiste bajar pantallas antes de dormir? 🙂",
    ],

    anxiety: [
      "¿Cómo está tu ansiedad hoy — más ligera o fuerte? 🤍",
      "¿Tuviste хотя sea un momento de calma hoy? 🫶",
      "¿Qué lo activó? Lo suavizamos juntos. 🌿",
      "¿Te sientes seguro(a) ahora? 🤍",
      "¿Quieres grounding o motivación? 🌿",
      "Respira conmigo una vez… y dime cómo te sientes. 🤍",
    ],

    illness: [
      "¿Cómo te sientes físicamente hoy — algo mejor? 🤍",
      "¿Pudiste tomar agua / descansar hoy? 🌿",
      "¿Tu cuerpo está más amable hoy que ayer? 🫶",
      "¿Qué haría hoy 5% más fácil? 🤍",
      "¿Quieres consuelo o un plan pequeño? 🌿",
    ],

    diet: [
      "¿Cómo va tu comida hoy — nutritiva o caótica? 🤍",
      "¿Tomaste agua hoy? Pregunta suave. 🌿",
      "¿Alguna decisión sana hoy de la que estás orgulloso(a)? 🙂",
      "¿Quieres ideas simples o solo apoyo? 🫶",
      "¿Escuchaste a tu cuerpo hoy? 🤍",
    ],

    moved_city: [
      "¿Cómo se siente el lugar nuevo hoy — más como hogar? 🏡🤍",
      "¿Descubriste algo nuevo por ahí? ✨",
      "¿Te acomodaste un poquito más desde la mudanza? 🌿",
      "¿Qué es lo que más te gusta hasta ahora? 🙂",
      "¿Te sientes solo(a) ahí o emocionado(a)? ☁️",
    ],

    conflict_friend: [
      "¿Cómo va el tema con tu amigo(a) ahora — más calmado? 🤍",
      "¿Volvieron a hablar? 🌿",
      "¿Quieres arreglarlo o proteger tu paz? 🙂",
      "¿Cómo sería un límite sano aquí? 🌿",
      "¿Te estás culpando o estás siendo justo(a)? ☁️",
    ],

    big_win: [
      "¿Todavía te sientes orgulloso(a) de esa victoria hoy? ✨",
      "¿Ese éxito te dio impulso? 🙂",
      "¿Cuál es el siguiente paso pequeño para mantener la racha? 🌿",
      "¿Compartiste ese logro con alguien? 🤍",
      "¿Qué quieres construir ahora con ese impulso? 🚀",
    ],

    bad_day: [
      "Hey… ¿hoy fue pesado? Estoy aquí. 🤍",
      "¿Quieres hablar o solo respirar juntos? 🫶",
      "¿Qué fue lo que más dolió hoy? ☁️",
      "¿Qué te daría un poquito de consuelo ahora? 🌿",
      "No tienes que ser fuerte solo(a). ¿Cómo estás? 🤍",
    ],

    good_day: [
      "¡Hey! ¿Qué hizo que hoy fuera bueno para ti? ✨",
      "¿Tuviste un momento que te sacó una sonrisa? 🙂",
      "¿De qué estás orgulloso(a) hoy? 💜",
      "¿Hoy te sientes más ligero(a) que ayer? 🌿",
      "Cuéntame el highlight — quiero celebrarlo contigo. ✨",
    ],

    default: [
      "Mini check-in: ¿cómo va eso que me contaste el otro día? 🤍",
      "¿Cómo te sientes hoy con esa situación? 🌿",
      "Una frase honesta: ¿cómo estás ahora? ☁️",
      "¿Cambió algo desde la última vez? 🙂",
      "¿Quieres apoyo o un plan hoy? 🫶",
      "Estoy aquí. ¿Qué tienes en la mente hoy? 🤍",
      "¿Se está haciendo más fácil o sigue duro? 🌿",
      "Si pudieras sentirte 10% mejor hoy, ¿qué ayudaría? 🙂",
      "¿Necesitas motivación suave o solo cariño? 💜",
      "Dime tu nivel emocional (0–10) ahora mismo. 🤍",
    ],
  },
};

function smartFallback(args: BuildArgs) {
  const { lang, summary } = args;
  if (lang === "es") {
    const base = summary?.trim()
      ? `Mini check-in sobre lo que me contaste (${summary.trim()}): ¿cómo va hoy?`
      : "Mini check-in… ¿cómo va eso que me contaste?";
    return `${base} ${tagES()}`;
  }
  const base = summary?.trim()
    ? `Quick check-in about what you told me (${summary.trim()}): how is it going today?`
    : "Quick check-in… how is that thing you told me about going today?";
  return `${base} ${tagEN()}`;
}

export function buildFollowUp(args: BuildArgs) {
  const { evKey, lang, uid } = args;
  const dict = FU[lang] || FU.en;

  const list = dict[evKey] || dict.default;
  if (!list || !list.length) return smartFallback(args);

  // анти-повтор: запоминаем evKey|idx
  const recent = loadRecent(uid, lang);
  const banned = new Set<number>();
  const lastPairs = new Set(recent.slice(0, 6)); // последние 6
  for (let i = 0; i < list.length; i++) {
    if (lastPairs.has(`${evKey}|${i}`)) banned.add(i);
  }

  const idx = pickIndex(list.length, banned);
  const text = list[idx];

  saveRecent(uid, lang, [`${evKey}|${idx}`, ...recent]);

  return text;
}
