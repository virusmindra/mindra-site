export function normLocale(locale: string) {
  const l = (locale || 'en').toLowerCase();
  if (l.startsWith('ru')) return 'ru';
  if (l.startsWith('uk')) return 'uk';
  if (l.startsWith('hy')) return 'hy';
  if (l.startsWith('ka')) return 'ka';
  if (l.startsWith('pl')) return 'pl';
  if (l.startsWith('ro')) return 'ro';
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('de')) return 'de';
  if (l.startsWith('kk')) return 'kk';
  if (l.startsWith('es')) return 'es';
  return 'en';
}

// "через 10 минут" / "in 10 min" / "10 min"
export function looksRelativeHint(raw: string) {
  const s = (raw || '').toLowerCase();

  if (/\bin\s+\d+\s*(min|mins|minutes|hour|hours|day|days)\b/.test(s)) return true;
  if (/\bчерез\s+\d+\b/.test(s)) return true;
  if (/\bза\s+\d+\s*(хв|хвилин|годин)\b/.test(s)) return true;
  if (/\b\d+\s*(мин|минут|хв|хвилин|час|часа|часов|годин|день|дня|дней)\b/.test(s)) return true;

  return false;
}

// супер-MVP парсер: HH:MM текст | "in 10 min" | "через 10 мин" | "tomorrow 9:00" | "завтра 9:00"
export function parseNaturalTime(raw: string, locale: string) {
  const s = (raw || '').trim();
  if (!s) return null;

  // 1) "HH:MM текст"
  const m = s.match(/^\s*(\d{1,2})[:.](\d{2})\s+(.+)$/);
  if (m) {
    const hh = Number(m[1]); const mm = Number(m[2]);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
      return { kind: 'fixed' as const, hh, mm, text: m[3].trim() };
    }
  }

  // 2) "in 10 min / hour"
  const enRel = s.match(/\bin\s+(\d+)\s*(min|mins|minutes|hour|hours)\b/i);
  if (enRel) {
    const n = Number(enRel[1]);
    const unit = enRel[2].toLowerCase().startsWith('hour') ? 60 : 1;
    return { kind: 'relative' as const, minutes: n * unit, text: s };
  }

  // 3) "через 10 мин/час"
  const ruRel = s.match(/\bчерез\s+(\d+)\s*(мин|минут|час|часа|часов)?\b/i);
  if (ruRel) {
    const n = Number(ruRel[1]);
    const u = (ruRel[2] || 'мин').toLowerCase();
    const unit = u.startsWith('час') ? 60 : 1;
    return { kind: 'relative' as const, minutes: n * unit, text: s };
  }

  // 4) "завтра 9:00"
  const tomorrow = s.match(/\b(завтра|tomorrow)\b.*?(\d{1,2})[:.](\d{2})/i);
  if (tomorrow) {
    const hh = Number(tomorrow[2]); const mm = Number(tomorrow[3]);
    return { kind: 'tomorrow' as const, hh, mm, text: s };
  }

  return null;
}

// перенос тихих часов (quiet_start..quiet_end)
export function isQuietHour(localHour: number, quietStart: number, quietEnd: number) {
  // пример: 22..8 => quiet если h>=22 или h<8
  if (quietStart === quietEnd) return false;
  if (quietStart < quietEnd) return localHour >= quietStart && localHour < quietEnd;
  return localHour >= quietStart || localHour < quietEnd;
}
