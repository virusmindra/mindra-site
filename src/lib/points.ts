// src/lib/points.ts
'use client';

const totalKey = (uid: string) => `mindra_points_total:${uid}`;
const premiumKey = (uid: string) => `mindra_premium_until:${uid}`; // unix ms

export function getTotalPoints(uid: string) {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(totalKey(uid));
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function setTotalPoints(uid: string, total: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(totalKey(uid), String(Math.max(0, Math.floor(total))));
}

export function addPoints(uid: string, delta: number) {
  const total = getTotalPoints(uid) + (Number.isFinite(delta) ? delta : 0);
  setTotalPoints(uid, total);
  return getTotalPoints(uid);
}

export function spendPoints(uid: string, cost: number) {
  const total = getTotalPoints(uid);
  if (total < cost) return { ok: false, total };
  const next = total - cost;
  setTotalPoints(uid, next);
  return { ok: true, total: next };
}

// --- premium days (MVP local) ---
export function getPremiumUntil(uid: string) {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(premiumKey(uid));
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function addPremiumDays(uid: string, days: number) {
  const now = Date.now();
  const cur = Math.max(getPremiumUntil(uid), now);
  const addedMs = Math.max(0, days) * 24 * 60 * 60 * 1000;
  const next = cur + addedMs;
  localStorage.setItem(premiumKey(uid), String(next));
  return next;
}

export function isPremiumActive(uid: string) {
  return getPremiumUntil(uid) > Date.now();
}
