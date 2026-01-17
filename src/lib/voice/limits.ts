export const PLAN_LIMITS = {
  FREE: { voiceSeconds: 3 * 60, dailySecondsDefault: 3 * 60 },
  PLUS: { voiceSeconds: 120 * 60, dailySecondsDefault: 5 * 60 }, // дефолт daily
  PRO:  { voiceSeconds: 300 * 60, dailySecondsDefault: 12 * 60 },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export function getVoiceLeftSeconds(ent: { voiceSecondsTotal: number; voiceSecondsUsed: number }) {
  return Math.max(0, ent.voiceSecondsTotal - ent.voiceSecondsUsed);
}

export function monthKeyNY(d = new Date()) {
  const ny = new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const y = ny.getFullYear();
  const m = String(ny.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // YYYY-MM
}

export function todayKeyNY() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find(p => p.type === "year")?.value ?? "1970";
  const m = parts.find(p => p.type === "month")?.value ?? "01";
  const d = parts.find(p => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`; // YYYY-MM-DD
}
