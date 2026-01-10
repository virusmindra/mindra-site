export const PLAN_LIMITS = {
  FREE: { voiceSeconds: 0, dailySecondsDefault: 0 },
  PLUS: { voiceSeconds: 120 * 60, dailySecondsDefault: 5 * 60 }, // дефолт daily
  PRO:  { voiceSeconds: 300 * 60, dailySecondsDefault: 12 * 60 },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export function getVoiceLeftSeconds(ent: { voiceSecondsTotal: number; voiceSecondsUsed: number }) {
  return Math.max(0, ent.voiceSecondsTotal - ent.voiceSecondsUsed);
}

// MVP: по New York. Потом можно взять UserSettings.tz.
export function todayKeyNY() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
