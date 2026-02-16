// app/api/user-badges/route.ts
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('user_badges')
    .select(`
      *,
      badges(name, image_url, level_required)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ badges: data || [] });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { badge_id, slot } = await request.json();
  
  if (!badge_id || !slot || slot < 1 || slot > 5) {
    return NextResponse.json({ error: 'Invalid slot or badge' }, { status: 400 });
  }

  await supabaseAdmin
    .from('user_badges')
    .update({ equipped_slot: null })
    .eq('user_id', user.id)
    .eq('equipped_slot', slot);

  const { error } = await supabaseAdmin
    .from('user_badges')
    .update({ equipped_slot: slot })
    .eq('user_id', user.id)
    .eq('badge_id', badge_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
