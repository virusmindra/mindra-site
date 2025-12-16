// src/lib/points.ts
'use client';

const pointsKey = (uid: string) => `mindra_points:${uid}`;

export function getTotalPoints(uid: string) {
  if (typeof window === 'undefined') return 0;

  const raw = localStorage.getItem(pointsKey(uid));
  const n = Number(raw);

  return Number.isFinite(n) ? n : 0;
}

export function addPoints(uid: string, delta: number) {
  const total = getTotalPoints(uid) + (Number.isFinite(delta) ? delta : 0);
  localStorage.setItem(pointsKey(uid), String(total));
  return total;
}
