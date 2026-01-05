import { isQuietHour } from "@/lib/reminders/time";

// local hour в конкретной TZ
export function getLocalHour(nowUtc: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    hour12: false,
  }).formatToParts(nowUtc);

  const hh = Number(parts.find(p => p.type === "hour")?.value ?? "0");
  return hh;
}

// вычислить ближайший момент "конец quiet" (по TZ) и вернуть Date в UTC
export function computeQuietEndUtc(nowUtc: Date, tz: string, quietStart: number, quietEnd: number) {
  // берём "сегодняшнюю дату" в tz
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(nowUtc);

  const y = Number(parts.find(p => p.type === "year")?.value);
  const m = Number(parts.find(p => p.type === "month")?.value);
  const d = Number(parts.find(p => p.type === "day")?.value);

  // создаём локальную дату конца quiet: сегодня quietEnd:00
  // но если quiet через ночь (22..8), и мы сейчас ночью, конец quiet будет сегодня в 08:00,
  // а если сейчас вечером после 22 — конец quiet завтра в 08:00.
  const localHour = getLocalHour(nowUtc, tz);
  let addDay = 0;

  if (quietStart > quietEnd) {
    // через ночь
    if (localHour >= quietStart) addDay = 1; // вечер после старта => конец завтра
    else addDay = 0; // ночь/утро до quietEnd => конец сегодня
  } else {
    // не через ночь (редко), если сейчас в quiet — конец сегодня
    addDay = 0;
  }

  // Собираем ISO для локального времени в TZ через Intl трюк:
  // создаём Date как будто UTC, но потом "переведём" через timeZone offset невозможно напрямую,
  // поэтому делаем проще: берём "время в TZ" форматированием и парсим.
  // Для MVP: используем Date.UTC и потом корректируем разницей между tz и utc через formatToParts.
  // Практичнее: просто запланировать snoozeUntilUtc "через N минут до конца quiet".
  // Но тут сделаем аккуратно через "следующий час" расчётом.

  const targetLocal = new Date(Date.UTC(y, m - 1, d + addDay, quietEnd, 0, 0));

  // targetLocal сейчас в UTC, но мы хотим “как если бы это было local TZ”.
  // Вычислим разницу: какие “часы” показывает TZ для targetLocal и подгоним.
  const tzParts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(targetLocal);

  const tzH = Number(tzParts.find(p => p.type === "hour")?.value ?? "0");
  const tzM = Number(tzParts.find(p => p.type === "minute")?.value ?? "0");

  // Нам нужно, чтобы в TZ было quietEnd:00, а сейчас tzH:tzM.
  const diffMin = (quietEnd * 60 + 0) - (tzH * 60 + tzM);

  return new Date(targetLocal.getTime() + diffMin * 60_000);
}

export function shouldSuppressByQuietHours(args: {
  nowUtc: Date;
  dueUtc: Date;
  tz: string;
  quietEnabled: boolean;
  quietStart: number;
  quietEnd: number;
  quietBypassMin: number;
  urgent: boolean;
}) {
  const { nowUtc, dueUtc, tz, quietEnabled, quietStart, quietEnd, quietBypassMin, urgent } = args;

  if (!quietEnabled) return { suppress: false as const };

  const localHour = getLocalHour(nowUtc, tz);
  const inQuiet = isQuietHour(localHour, quietStart, quietEnd);
  if (!inQuiet) return { suppress: false as const };

  // bypass: если дедлайн очень близко (или urgent) — можно пробить
  const deltaMin = (dueUtc.getTime() - nowUtc.getTime()) / 60_000;
  const canBypass = urgent || deltaMin <= quietBypassMin;
  if (canBypass) return { suppress: false as const };

  const snoozeUntilUtc = computeQuietEndUtc(nowUtc, tz, quietStart, quietEnd);
  return { suppress: true as const, snoozeUntilUtc };
}
