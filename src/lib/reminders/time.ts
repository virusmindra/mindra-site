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

export function parseNaturalTime(raw: string, locale: string) {
  const s = (raw || "").trim();
  if (!s) return null;

  const l = (locale || "en").toLowerCase();
  const lower = s.toLowerCase();

  const clampTime = (hh: number, mm: number) => {
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;
    return { hh, mm };
  };

  const extractTime = (text: string) => {
    // 18:30 / 18.30 / 9:00
    const m = text.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    const ok = clampTime(hh, mm);
    return ok ? ok : null;
  };

  const stripTimeFromText = (text: string) =>
    text.replace(/\b(\d{1,2})[:.](\d{2})\b/g, " ").replace(/\s{2,}/g, " ").trim();

  const monthsEN: Record<string, number> = {
    jan: 1, january: 1,
    feb: 2, february: 2,
    mar: 3, march: 3,
    apr: 4, april: 4,
    may: 5,
    jun: 6, june: 6,
    jul: 7, july: 7,
    aug: 8, august: 8,
    sep: 9, sept: 9, september: 9,
    oct: 10, october: 10,
    nov: 11, november: 11,
    dec: 12, december: 12,
  };

  const monthsES: Record<string, number> = {
    ene: 1, enero: 1,
    feb: 2, febrero: 2,
    mar: 3, marzo: 3,
    abr: 4, abril: 4,
    may: 5, mayo: 5,
    jun: 6, junio: 6,
    jul: 7, julio: 7,
    ago: 8, agosto: 8,
    sep: 9, sept: 9, septiembre: 9, setiembre: 9,
    oct: 10, octubre: 10,
    nov: 11, noviembre: 11,
    dic: 12, diciembre: 12,
  };

  const weekdaysEN: Record<string, number> = {
    mon: 1, monday: 1,
    tue: 2, tues: 2, tuesday: 2,
    wed: 3, weds: 3, wednesday: 3,
    thu: 4, thur: 4, thurs: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
    sun: 0, sunday: 0,
  };

  const weekdaysES: Record<string, number> = {
    lun: 1, lunes: 1,
    mar: 2, martes: 2,
    mie: 3, mié: 3, miercoles: 3, miércoles: 3,
    jue: 4, jueves: 4,
    vie: 5, viernes: 5,
    sab: 6, sáb: 6, sabado: 6, sábado: 6,
    dom: 0, domingo: 0,
  };

  // =========================
  // 1) "HH:MM text" (универсально)
  // =========================
  {
    const m = s.match(/^\s*(\d{1,2})[:.](\d{2})\s+(.+)$/);
    if (m) {
      const hh = Number(m[1]);
      const mm = Number(m[2]);
      const ok = clampTime(hh, mm);
      if (ok) return { kind: "fixed" as const, hh: ok.hh, mm: ok.mm, text: m[3].trim() };
    }
  }

  // =========================
  // 2) Relative EN/ES (minutes/hours/days/weeks)
  // =========================
  // EN: in/after 10 min|hour|day|week
  {
    const m = lower.match(/\b(?:in|after)\s+(\d+)\s*(min|mins|minute|minutes|h|hr|hrs|hour|hours|day|days|week|weeks)\b/);
    if (m) {
      const n = Number(m[1]);
      const unit = m[2];
      let minutes = n;
      if (unit.startsWith("h")) minutes = n * 60;
      else if (unit.startsWith("day")) minutes = n * 1440;
      else if (unit.startsWith("week")) minutes = n * 10080;
      else minutes = n; // minutes
      return { kind: "relative" as const, minutes, text: s };
    }
  }

  // ES: en/dentro de 10 min|minutos|hora|día|semana
  {
    const m = lower.match(/\b(?:en|dentro\s+de)\s+(\d+)\s*(min|minuto|minutos|hora|horas|día|dias|días|semana|semanas)\b/);
    if (m) {
      const n = Number(m[1]);
      const unit = m[2];
      let minutes = n;
      if (unit.startsWith("hora")) minutes = n * 60;
      else if (unit.startsWith("día") || unit.startsWith("dia") || unit.startsWith("días") || unit.startsWith("dias")) minutes = n * 1440;
      else if (unit.startsWith("semana")) minutes = n * 10080;
      else minutes = n; // minutes
      return { kind: "relative" as const, minutes, text: s };
    }
  }

  // =========================
  // 3) Relative calendar (months/years) EN/ES
  // =========================
  // EN: in 2 months / in 1 year
  {
    const m = lower.match(/\b(?:in|after)\s+(\d+)\s*(month|months|year|years)\b/);
    if (m) {
      const n = Number(m[1]);
      const unit = m[2];
      const months = unit.startsWith("month") ? n : 0;
      const years = unit.startsWith("year") ? n : 0;
      return { kind: "relative_calendar" as const, months, years, text: s };
    }
  }

  // ES: en 2 meses / en 1 año / dentro de 3 años
  {
    const m = lower.match(/\b(?:en|dentro\s+de)\s+(\d+)\s*(mes|meses|año|años|ano|anos)\b/);
    if (m) {
      const n = Number(m[1]);
      const unit = m[2];
      const months = (unit === "mes" || unit === "meses") ? n : 0;
      const years = (unit.startsWith("año") || unit.startsWith("ano")) ? n : 0;
      return { kind: "relative_calendar" as const, months, years, text: s };
    }
  }

  // EN quick: next week/month/year
  {
    if (/\bnext\s+week\b/.test(lower)) return { kind: "relative" as const, minutes: 10080, text: s };
    if (/\bnext\s+month\b/.test(lower)) return { kind: "relative_calendar" as const, months: 1, years: 0, text: s };
    if (/\bnext\s+year\b/.test(lower)) return { kind: "relative_calendar" as const, months: 0, years: 1, text: s };
  }

  // ES quick: la próxima semana / el próximo mes / el próximo año
  {
    if (/\bpr[oó]xima\s+semana\b/.test(lower)) return { kind: "relative" as const, minutes: 10080, text: s };
    if (/\bpr[oó]ximo\s+mes\b/.test(lower)) return { kind: "relative_calendar" as const, months: 1, years: 0, text: s };
    if (/\bpr[oó]ximo\s+a[nñ]o\b/.test(lower)) return { kind: "relative_calendar" as const, months: 0, years: 1, text: s };
  }

  // =========================
  // 4) Tomorrow + time (EN/ES)
  // =========================
  {
    const m = lower.match(/\b(?:tomorrow|mañana|manana)\b.*?\b(?:at|a\s+las|a\s+la)?\s*(\d{1,2})(?:[:.](\d{2}))?\b/);
    if (m) {
      const hh = Number(m[1]);
      const mm = Number(m[2] ?? "0");
      const ok = clampTime(hh, mm);
      if (ok) return { kind: "tomorrow" as const, hh: ok.hh, mm: ok.mm, text: s };
    }
  }

  // =========================
  // 5) Weekday (EN/ES): on Monday / el lunes / lunes a las 9:00
  // =========================
  {
    // EN
    const m = lower.match(/\b(?:on\s+)?(mon|monday|tue|tues|tuesday|wed|weds|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday)\b/);
    if (m) {
      const wd = weekdaysEN[m[1]];
      const t = extractTime(lower);
      return { kind: "weekday" as const, weekday: wd, hh: t?.hh ?? 9, mm: t?.mm ?? 0, text: stripTimeFromText(s) };
    }
  }
  {
    // ES
    const m = lower.match(/\b(?:el\s+)?(lun|lunes|mar|martes|mie|mié|miercoles|miércoles|jue|jueves|vie|viernes|sab|sáb|sabado|sábado|dom|domingo)\b/);
    if (m) {
      const wd = weekdaysES[m[1]];
      const t = extractTime(lower);
      return { kind: "weekday" as const, weekday: wd, hh: t?.hh ?? 9, mm: t?.mm ?? 0, text: stripTimeFromText(s) };
    }
  }

  // =========================
  // 6) Absolute date (ISO + common formats + month names EN/ES)
  // =========================
  // 6.1) ISO: 2026-01-07 or 2026-01-07 18:30
  {
    const m = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (m) {
      const yyyy = Number(m[1]);
      const mm = Number(m[2]);
      const dd = Number(m[3]);
      const t = extractTime(lower);
      return { kind: "date" as const, yyyy, month: mm, day: dd, hh: t?.hh ?? 9, mm: t?.mm ?? 0, text: stripTimeFromText(s) };
    }
  }

  // 6.2) Numeric: 01/07/2026 or 7/1/2026 or 07.01.2026
  {
    const m = lower.match(/\b(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))\b/);
    if (m) {
      let a = Number(m[1]);
      let b = Number(m[2]);
      let y = Number(m[3]);
      if (y < 100) y += 2000;

      // IMPORTANT: mm/dd для EN, dd/mm для ES (и для всего не-en)
      const isEN = l.startsWith("en");
      const month = isEN ? a : b;
      const day = isEN ? b : a;

      const t = extractTime(lower);
      return { kind: "date" as const, yyyy: y, month, day, hh: t?.hh ?? 9, mm: t?.mm ?? 0, text: stripTimeFromText(s) };
    }
  }

  // 6.3) Month names EN: "Jan 7", "January 7", "7 Jan"
  {
    // January 7
    const m1 = lower.match(/\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b\s+(\d{1,2})(?:\b|,)(?:\s+(\d{4}))?/);
    // 7 January
    const m2 = lower.match(/\b(\d{1,2})\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b(?:\s+(\d{4}))?/);

    const m = m1 ? { mon: m1[1], day: m1[2], year: m1[3] } : m2 ? { mon: m2[2], day: m2[1], year: m2[3] } : null;
    if (m) {
      const month = monthsEN[m.mon];
      const day = Number(m.day);
      const yyyy = m.year ? Number(m.year) : new Date().getFullYear();
      const t = extractTime(lower);
      return { kind: "date" as const, yyyy, month, day, hh: t?.hh ?? 9, mm: t?.mm ?? 0, text: stripTimeFromText(s) };
    }
  }

  // 6.4) Month names ES: "7 enero", "enero 7", optional year
  {
    const m1 = lower.match(/\b(ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|sept|septiembre|setiembre|oct|octubre|nov|noviembre|dic|diciembre)\b\s+(\d{1,2})(?:\b|,)(?:\s+(\d{4}))?/);
    const m2 = lower.match(/\b(\d{1,2})\s+(ene|enero|feb|febrero|mar|marzo|abr|abril|may|mayo|jun|junio|jul|julio|ago|agosto|sep|sept|septiembre|setiembre|oct|octubre|nov|noviembre|dic|diciembre)\b(?:\s+(\d{4}))?/);

    const m = m1 ? { mon: m1[1], day: m1[2], year: m1[3] } : m2 ? { mon: m2[2], day: m2[1], year: m2[3] } : null;
    if (m) {
      const month = monthsES[m.mon];
      const day = Number(m.day);
      const yyyy = m.year ? Number(m.year) : new Date().getFullYear();
      const t = extractTime(lower);
      return { kind: "date" as const, yyyy, month, day, hh: t?.hh ?? 9, mm: t?.mm ?? 0, text: stripTimeFromText(s) };
    }
  }

  // =========================
  // 7) Fixed time today: at 18:30 / a las 18:30
  // =========================
  {
    const m = lower.match(/\b(?:at|a\s+las|a\s+la)\s*(\d{1,2})(?:[:.](\d{2}))\b/);
    if (m) {
      const hh = Number(m[1]);
      const mm = Number(m[2]);
      const ok = clampTime(hh, mm);
      if (ok) return { kind: "fixed" as const, hh: ok.hh, mm: ok.mm, text: s };
    }
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
