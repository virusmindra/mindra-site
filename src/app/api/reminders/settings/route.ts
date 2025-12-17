import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');
  if (!uid) return NextResponse.json({ ok: false, error: 'uid required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // если нет — вернём дефолт (и можно сразу upsert сделать)
  return NextResponse.json({
    ok: true,
    settings: data ?? { uid, tz: 'UTC', quiet_start: 22, quiet_end: 8, quiet_bypass_min: 30 },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { uid, tz, quiet_start, quiet_end, quiet_bypass_min } = body || {};
  if (!uid) return NextResponse.json({ ok: false, error: 'uid required' }, { status: 400 });

  const payload = {
    uid,
    tz: String(tz || 'UTC'),
    quiet_start: Number(quiet_start ?? 22),
    quiet_end: Number(quiet_end ?? 8),
    quiet_bypass_min: Number(quiet_bypass_min ?? 30),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from('user_settings').upsert(payload);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
