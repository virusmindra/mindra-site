import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { looksRelativeHint, parseNaturalTime, isQuietHour, normLocale } from '@/lib/reminders/time';

function toUtcFromLocalParts(base: Date, tz: string) {
  // MVP: без сложной TZ-математики на сервере.
  // Пока используем: клиент будет присылать due_utc. (самый надёжный путь)
  // Здесь оставим заглушку.
  return base.toISOString();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');
  if (!uid) return NextResponse.json({ ok: false, error: 'uid required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('reminders')
    .select('*')
    .eq('uid', uid)
    .neq('status', 'canceled')
    .order('due_utc', { ascending: true })
    .limit(100);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, reminders: data ?? [] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { uid, locale, text, due_utc } = body || {};

  if (!uid || !text) {
    return NextResponse.json({ ok: false, error: 'uid,text required' }, { status: 400 });
  }

  // 1) берём настройки
  const { data: settings } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();

  const tz = settings?.tz || 'UTC';
  const quietStart = Number(settings?.quiet_start ?? 22);
  const quietEnd = Number(settings?.quiet_end ?? 8);
  const bypassMin = Number(settings?.quiet_bypass_min ?? 30);

  // 2) due_utc лучше присылать уже готовым с клиента (самое надёжное)
  let dueUtcISO = String(due_utc || '');
  if (!dueUtcISO) {
    // fallback: пытаемся парсить на сервере (MVP)
    const parsed = parseNaturalTime(String(text), normLocale(locale || 'en'));
    if (!parsed) return NextResponse.json({ ok: false, error: 'cannot parse time' }, { status: 400 });
    // тут лучше позже сделать норм TZ
    dueUtcISO = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  }

  // 3) quiet hours bypass
  const isRel = looksRelativeHint(String(text));
  const now = Date.now();
  const dueMs = Date.parse(dueUtcISO);
  const deltaMin = Math.max(0, (dueMs - now) / 60000);
  const urgent = Boolean(isRel && deltaMin <= bypassMin);

  // 4) лимиты (пока MVP: 50 активных)
  const { count } = await supabaseAdmin
    .from('reminders')
    .select('*', { count: 'exact', head: true })
    .eq('uid', uid)
    .eq('status', 'scheduled');

  if ((count ?? 0) >= 50) {
    return NextResponse.json({ ok: false, error: 'limit reached' }, { status: 429 });
  }

  const { data, error } = await supabaseAdmin
    .from('reminders')
    .insert({
      uid,
      text: String(text),
      due_utc: dueUtcISO,
      tz,
      status: 'scheduled',
      urgent,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, reminder: data });
}
