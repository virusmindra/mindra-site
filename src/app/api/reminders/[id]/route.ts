import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');
  const id = Number(params.id);
  if (!uid || !id) return NextResponse.json({ ok: false }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('reminders')
    .update({ status: 'canceled' })
    .eq('id', id)
    .eq('uid', uid);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
