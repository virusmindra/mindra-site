// src/lib/points.ts
'use client';

export const pointsKey = (uid: string) => `mindra_points_total:${uid}`;
export const premiumUntilKey = (uid: string) => `mindra_premium_until:${uid}`; // unix ms

export function getTotalPoints(uid: string) {
  if (typeof window === 'undefined') return 0;
  const n = Number(localStorage.getItem(pointsKey(uid)) || 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function setTotalPoints(uid: string, total: number) {
  if (typeof window === 'undefined') return;
  const n = Number(total);
  const safe = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  localStorage.setItem(pointsKey(uid), String(safe));
}

export function addPoints(uid: string, delta: number) {
  if (typeof window === 'undefined') return 0;
  const d = Number(delta);
  const inc = Number.isFinite(d) ? Math.floor(d) : 0;
  const next = getTotalPoints(uid) + inc;
  setTotalPoints(uid, next);
  return next;
}

export function spendPoints(uid: string, cost: number) {
  if (typeof window === 'undefined') return { ok: false, total: 0 };

  const c = Number(cost);
  const need = Number.isFinite(c) ? Math.max(0, Math.floor(c)) : 0;

  const total = getTotalPoints(uid);
  if (total < need) return { ok: false, total };

  const next = total - need;
  setTotalPoints(uid, next);
  return { ok: true, total: next };
}

// --- premium days (MVP local) ---
export function getPremiumUntil(uid: string) {
  if (typeof window === 'undefined') return 0;
  const n = Number(localStorage.getItem(premiumUntilKey(uid)) || 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function addPremiumDays(uid: string, days: number) {
  if (typeof window === 'undefined') return 0;

  const d = Number(days);
  const addDays = Number.isFinite(d) ? Math.max(0, Math.floor(d)) : 0;

  const now = Date.now();
  const cur = getPremiumUntil(uid);
  const base = cur > now ? cur : now;

  const next = base + addDays * 24 * 60 * 60 * 1000;
  localStorage.setItem(premiumUntilKey(uid), String(next));
  return next;
}

export function isPremiumActive(uid: string) {
  return getPremiumUntil(uid) > Date.now();
}
