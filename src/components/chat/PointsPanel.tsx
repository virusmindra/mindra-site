'use client';

import { useEffect, useMemo, useState } from 'react';
import { addPremiumDays, getPremiumUntil, getTotalPoints, spendPoints } from '@/lib/points';

type Props = {
  uid: string;      // getOrCreateWebUid()
  locale: string;   // getLocaleFromPath()
};

function dayWord(locale: string, n: number) {
  const L = normLocale(locale);

  if (L === 'ru') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
    return 'дней';
  }

  if (L === 'uk') {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'день';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дні';
    return 'днів';
  }

  // остальные языки — нейтрально
  return n === 1 ? 'day' : 'days';
}

function ptsLabel(locale: string) {
  const L = normLocale(locale);
  const map: Record<string, string> = {
    ru: 'очк.',
    uk: 'бал.',
    en: 'pts',
    es: 'pts',
    fr: 'pts',
    de: 'Pkt',
    pl: 'pkt',
    ro: 'pct',
    kk: 'ұпай',
    ka: 'ქულა',
    hy: 'միավոր',
  };
  return map[L] ?? 'pts';
}

function normLocale(locale: string) {
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

function fmtDate(ms: number, locale: string) {
  if (!ms) return '—';
  const d = new Date(ms);
  try {
    return d.toLocaleString(locale || undefined);
  } catch {
    return d.toLocaleString();
  }
}

function labels(locale: string) {
  const L = normLocale(locale);
  const pick = (m: Record<string, string>) => m[L] ?? m.en;

  return {
    title: pick({
      ru: 'Очки и премиум',
      uk: 'Бали і преміум',
      en: 'Points & Premium',
      es: 'Puntos y Premium',
      fr: 'Points & Premium',
      de: 'Punkte & Premium',
      pl: 'Punkty i Premium',
      ro: 'Puncte & Premium',
      kk: 'Ұпайлар және Premium',
      ka: 'ქულები და Premium',
      hy: 'Միավորներ և Premium',
    }),
    total: pick({
      ru: 'Твои очки',
      uk: 'Твої бали',
      en: 'Your points',
      es: 'Tus puntos',
      fr: 'Tes points',
      de: 'Deine Punkte',
      pl: 'Twoje punkty',
      ro: 'Punctele tale',
      kk: 'Ұпайларың',
      ka: 'შენი ქულები',
      hy: 'Քո միավորները',
    }),
    premiumUntil: pick({
      ru: 'Премиум активен до',
      uk: 'Преміум активний до',
      en: 'Premium active until',
      es: 'Premium activo hasta',
      fr: 'Premium actif jusqu’au',
      de: 'Premium aktiv bis',
      pl: 'Premium aktywny do',
      ro: 'Premium activ până la',
      kk: 'Premium белсенді дейін',
      ka: 'Premium აქტიურია',
      hy: 'Premium-ը ակտիվ է մինչև',
    }),
    redeem: pick({
      ru: 'Обменять',
      uk: 'Обміняти',
      en: 'Redeem',
      es: 'Canjear',
      fr: 'Échanger',
      de: 'Einlösen',
      pl: 'Wymień',
      ro: 'Schimbă',
      kk: 'Айырбастау',
      ka: 'გაცვლა',
      hy: 'Փոխանակել',
    }),
    notEnough: pick({
      ru: 'Недостаточно очков 😕',
      uk: 'Недостатньо балів 😕',
      en: 'Not enough points 😕',
      es: 'No hay suficientes puntos 😕',
      fr: 'Pas assez de points 😕',
      de: 'Nicht genug Punkte 😕',
      pl: 'Za mało punktów 😕',
      ro: 'Nu ai destule puncte 😕',
      kk: 'Ұпай жетпейді 😕',
      ka: 'ქულები არ კმარა 😕',
      hy: 'Միավորները բավարար չեն 😕',
    }),
    success: pick({
      ru: 'Готово! Премиум продлён 💜',
      uk: 'Готово! Преміум продовжено 💜',
      en: 'Done! Premium extended 💜',
      es: '¡Listo! Premium extendido 💜',
      fr: 'C’est fait ! Premium prolongé 💜',
      de: 'Fertig! Premium verlängert 💜',
      pl: 'Gotowe! Premium przedłużone 💜',
      ro: 'Gata! Premium prelungit 💜',
      kk: 'Дайын! Premium ұзартылды 💜',
      ka: 'მზადაა! Premium გაგრძელდა 💜',
      hy: 'Պատրաստ է։ Premium-ը երկարացվեց 💜',
    }),

    // для строки "дней • очков"
    days: pick({
      ru: 'дн.',
      uk: 'дн.',
      en: 'day(s)',
      es: 'día(s)',
      fr: 'jour(s)',
      de: 'Tag(e)',
      pl: 'dzień/dni',
      ro: 'zi(le)',
      kk: 'күн',
      ka: 'დღე',
      hy: 'օր',
    }),
    pts: pick({
      ru: 'очк.',
      uk: 'бал.',
      en: 'pts',
      es: 'pts',
      fr: 'pts',
      de: 'Pkt',
      pl: 'pkt',
      ro: 'pct',
      kk: 'ұпай',
      ka: 'ქულა',
      hy: 'միավոր',
    }),

    offerPlus1: pick({
      ru: 'Mindra+ (1 день)',
      uk: 'Mindra+ (1 день)',
      en: 'Mindra+ (1 day)',
      es: 'Mindra+ (1 día)',
      fr: 'Mindra+ (1 jour)',
      de: 'Mindra+ (1 Tag)',
      pl: 'Mindra+ (1 dzień)',
      ro: 'Mindra+ (1 zi)',
      kk: 'Mindra+ (1 күн)',
      ka: 'Mindra+ (1 დღე)',
      hy: 'Mindra+ (1 օր)',
    }),
    offerPlus5: pick({
      ru: 'Mindra+ (5 дней)',
      uk: 'Mindra+ (5 днів)',
      en: 'Mindra+ (5 days)',
      es: 'Mindra+ (5 días)',
      fr: 'Mindra+ (5 jours)',
      de: 'Mindra+ (5 Tage)',
      pl: 'Mindra+ (5 dni)',
      ro: 'Mindra+ (5 zile)',
      kk: 'Mindra+ (5 күн)',
      ka: 'Mindra+ (5 დღე)',
      hy: 'Mindra+ (5 օր)',
    }),
    offerPro1: pick({
      ru: 'Mindra Pro (1 день)',
      uk: 'Mindra Pro (1 день)',
      en: 'Mindra Pro (1 day)',
      es: 'Mindra Pro (1 día)',
      fr: 'Mindra Pro (1 jour)',
      de: 'Mindra Pro (1 Tag)',
      pl: 'Mindra Pro (1 dzień)',
      ro: 'Mindra Pro (1 zi)',
      kk: 'Mindra Pro (1 күн)',
      ka: 'Mindra Pro (1 დღე)',
      hy: 'Mindra Pro (1 օր)',
    }),
    offerPro5: pick({
      ru: 'Mindra Pro (5 дней)',
      uk: 'Mindra Pro (5 днів)',
      en: 'Mindra Pro (5 days)',
      es: 'Mindra Pro (5 días)',
      fr: 'Mindra Pro (5 jours)',
      de: 'Mindra Pro (5 Tage)',
      pl: 'Mindra Pro (5 dni)',
      ro: 'Mindra Pro (5 zile)',
      kk: 'Mindra Pro (5 күн)',
      ka: 'Mindra Pro (5 დღე)',
      hy: 'Mindra Pro (5 օր)',
    }),
  };
}

export default function PointsPanel({ uid, locale }: Props) {
  const t = useMemo(() => labels(locale), [locale]);

  const [total, setTotal] = useState(0);
  const [until, setUntil] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const OFFERS = useMemo(
    () => [
      { id: 'plus_1', title: t.offerPlus1, days: 1, cost: 3000 },
      { id: 'plus_5', title: t.offerPlus5, days: 5, cost: 12000 },
      { id: 'pro_1', title: t.offerPro1, days: 1, cost: 9000 },
      { id: 'pro_5', title: t.offerPro5, days: 5, cost: 36000 },
    ],
    [t],
  );

  const refresh = () => {
    setTotal(getTotalPoints(uid));
    setUntil(getPremiumUntil(uid));
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [uid]);

  const redeem = (cost: number, days: number) => {
    setMsg(null);
    const spent = spendPoints(uid, cost);
    if (!spent.ok) {
      setMsg(t.notEnough);
      refresh();
      return;
    }
    addPremiumDays(uid, days);
    setMsg(t.success);
    refresh();
  };

  return (
    <div className="flex flex-col h-full border-r border-white/10 bg-zinc-950/60">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-sm font-semibold">{t.title}</h2>
        <p className="text-xs text-zinc-400 mt-1">
          {t.total}:{' '}
          <span className="text-zinc-100 font-semibold">{total}</span>
          <br />
          {t.premiumUntil}:{' '}
          <span className="text-zinc-100">{fmtDate(until, locale)}</span>
        </p>
        {msg && <p className="mt-2 text-xs text-emerald-300">{msg}</p>}
      </div>

      <div className="flex-1 overflow-auto px-3 py-3 space-y-2">
        {OFFERS.map((o) => (
          <div
            key={o.id}
            className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex-1">
              <div className="text-sm text-zinc-100 font-medium">{o.title}</div>
              <div className="text-xs text-zinc-400">
                {o.days} {t.days} • {o.cost} {t.pts}
              </div>
            </div>

            <button
              onClick={() => redeem(o.cost, o.days)}
              className="text-xs px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
            >
              {t.redeem}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
