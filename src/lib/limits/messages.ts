export type LimitKind =
  | "daily_text"
  | "monthly_voice"
  | "monthly_goals"
  | "monthly_habits"
  | "monthly_reminders";

export function limitReply(kind: LimitKind, locale: "en" | "es" = "en") {
  const pricing = `/${locale}/pricing`;

  const EN: Record<LimitKind, { title: string; body: string }> = {
    daily_text: {
      title: "Daily message limit reached",
      body:
        "You’ve used all your messages for today. Upgrade to keep chatting with Mindra without limits. 💜",
    },
    monthly_voice: {
      title: "Voice minutes limit reached",
      body:
        "You’ve used all your voice minutes for this month. Upgrade to get more voice time. 💜",
    },
    monthly_goals: {
      title: "Goals limit reached",
      body:
        "You’ve reached your goals limit for this month. Upgrade to add more goals. 💜",
    },
    monthly_habits: {
      title: "Habits limit reached",
      body:
        "You’ve reached your habits limit for this month. Upgrade to add more habits. 💜",
    },
    monthly_reminders: {
      title: "Reminders limit reached",
      body:
        "You’ve reached your reminders limit for this month. Upgrade to create unlimited reminders. 💜",
    },
  };

  const ES: Record<LimitKind, { title: string; body: string }> = {
  daily_text: {
    title: "Se alcanzó el límite diario de mensajes",
    body:
      "Has usado todos tus mensajes de hoy. Actualiza tu suscripción para seguir chateando sin límites. 💜",
  },
  monthly_voice: {
    title: "Se alcanzó el límite de minutos de voz",
    body:
      "Has usado todos tus minutos de voz de este mes. Actualiza tu suscripción para obtener más minutos. 💜",
  },
  monthly_goals: {
    title: "Se alcanzó el límite de objetivos",
    body:
      "Has alcanzado el límite de objetivos para este mes. Actualiza tu suscripción para añadir más objetivos. 💜",
  },
  monthly_habits: {
    title: "Se alcanzó el límite de hábitos",
    body:
      "Has alcanzado el límite de hábitos para este mes. Actualiza tu suscripción para añadir más hábitos. 💜",
  },
  monthly_reminders: {
    title: "Se alcanzó el límite de recordatorios",
    body:
      "Has alcanzado el límite de recordatorios para este mes. Actualiza tu suscripción para crear recordatorios sin límites. 💜",
  },
};

  const dict = locale === "es" ? ES : EN;
  const x = dict[kind];

  return {
    kind,
    title: x.title,
    message: `${x.body}\n\n👉 Pricing: ${pricing}`,
    pricingUrl: pricing,
    cta: locale === "es" ? "Ver planes" : "View plans",
  };
}
