import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  // ✅ защита cron эндпоинта
  const secret = req.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // достаём пачку due
  const { data: due, error } = await supabaseAdmin
    .from('reminders')
    .select('*')
    .eq('status', 'scheduled')
    .lte('due_utc', now)
    .limit(200);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!due?.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // отмечаем sent
  const ids = due.map((r: any) => r.id);
  const { error: updErr } = await supabaseAdmin
    .from('reminders')
    .update({ status: 'sent', sent_at: now })
    .in('id', ids);

  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  // TODO: тут позже отправка web-push по push_subscriptions

  return NextResponse.json({ ok: true, processed: ids.length });
}
