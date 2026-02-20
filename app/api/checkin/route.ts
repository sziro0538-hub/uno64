// app/api/checkin/route.ts
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Функція для визначення чи потрібно видати бейджик на цьому рівні
function shouldAwardBadge(level: number): boolean {
  // Спеціальні рівні: 1, 3, 7, 12
  if ([1, 3, 7, 12].includes(level)) return true;
  
  // Після 12-го кожен 7-й рівень: 19, 26, 33, 40, 47...
  if (level >= 19 && (level - 12) % 7 === 0) return true;
  
  return false;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
  }

  // Отримати всі чекіни користувача
  const { data: allCheckins } = await supabaseAdmin
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .order('checkin_date', { ascending: false });

  // Отримати чекіни за останні 10 днів для відображення
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const dateFrom = tenDaysAgo.toISOString().split('T')[0];

  const recentCheckins = allCheckins?.filter(c => c.checkin_date >= dateFrom) || [];

  // Підрахувати загальну кількість та поточний рівень
  const totalCheckins = allCheckins?.length || 0;
  const currentLevel = totalCheckins;

  // Отримати всі бейджики користувача
  const { data: userBadges } = await supabaseAdmin
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false });

  // Отримати вибрані бейджики для профілю (топ-5)
  const { data: selectedBadges } = await supabaseAdmin
    .from('user_selected_badges')
    .select(`
      position,
      badge:badges(*)
    `)
    .eq('user_id', user.id)
    .order('position', { ascending: true });

  // Отримати всі доступні бейджики для прогрес-бару
  const { data: allBadges } = await supabaseAdmin
    .from('badges')
    .select('*')
    .order('level_required', { ascending: true });

  return NextResponse.json({ 
    checkins: recentCheckins,
    all_checkins: allCheckins,
    total_checkins: totalCheckins,
    current_level: currentLevel,
    user_badges: userBadges || [],
    selected_badges: selectedBadges || [],
    all_badges: allBadges || [],
    next_badge_level: allBadges?.find(b => b.level_required > currentLevel)?.level_required || null
  });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
  }

  // Читаємо force параметр для тестування
  let force = false;
  try {
    const body = await request.json();
    force = body.force === true;
  } catch {
    // Якщо body пустий, це нормально
  }

  // Підрахувати поточну кількість чекінів
  const { count: totalCheckins } = await supabaseAdmin
    .from('daily_checkins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const newLevel = (totalCheckins || 0) + 1;

  // Перевірка на сьогоднішній чекін (тільки якщо не тестовий режим)
  if (!force) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingCheckin } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', today)
      .maybeSingle();

    if (existingCheckin) {
      return NextResponse.json({ 
        error: 'Ви вже зробили чекін сьогодні',
        checkin: existingCheckin 
      }, { status: 400 });
    }
  }

  // Визначити дату чекіну
  let checkinDate;
if (force) {
  // У тестовому режимі йдемо назад від сьогодні
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - (totalCheckins || 0));
  checkinDate = baseDate.toISOString().split('T')[0];
  
  // Перевірити чи вже є чекін на цю дату
  const { data: existingOnDate } = await supabaseAdmin
    .from('daily_checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('checkin_date', checkinDate)
    .maybeSingle();
  
  // Якщо є - шукаємо першу вільну дату в минулому
  let daysBack = totalCheckins || 0;
  while (existingOnDate && daysBack < 1000) {
    daysBack++;
    const testDate = new Date();
    testDate.setDate(testDate.getDate() - daysBack);
    const testDateStr = testDate.toISOString().split('T')[0];
    
    const { data: testExisting } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', testDateStr)
      .maybeSingle();
    
    if (!testExisting) {
      checkinDate = testDateStr;
      break;
    }
  }
} else {
  checkinDate = new Date().toISOString().split('T')[0];
}

  // Перевірити чи потрібно видати бейджик
  let newBadgeId: number | null = null;
  let newBadge = null;

  if (shouldAwardBadge(newLevel)) {
    console.log(`Level ${newLevel} awards a badge!`);
    
    // Знайти бейджик для цього рівня
    const { data: badge } = await supabaseAdmin
      .from('badges')
      .select('*')
      .eq('level_required', newLevel)
      .maybeSingle();
    
    if (badge) {
      newBadgeId = badge.id;
      newBadge = badge;
      console.log('Badge found:', badge);
    } else {
      console.log('No badge found for level:', newLevel);
    }
  }

  // Створити чекін
  const { data: newCheckin, error } = await supabaseAdmin
    .from('daily_checkins')
    .insert([{ 
      user_id: user.id,
      checkin_date: checkinDate,
      level: newLevel,
      badge_id: newBadgeId
    }])
    .select()
    .single();

  if (error) {
    console.error('Insert checkin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Якщо є новий бейджик - додати в user_badges
  if (newBadgeId) {
    const { error: badgeError } = await supabaseAdmin
      .from('user_badges')
      .insert([{
        user_id: user.id,
        badge_id: newBadgeId,
        level_earned: newLevel
      }]);

    if (badgeError) {
      console.error('Insert user_badge error:', badgeError);
    } else {
      console.log('Badge awarded to user!');
    }
  }

  return NextResponse.json({ 
    success: true,
    checkin: newCheckin,
    level: newLevel,
    new_badge: newBadge, // Повний об'єкт бейджика якщо він є
    total_checkins: (totalCheckins || 0) + 1,
    badge_awarded: !!newBadgeId
  }, { status: 201 });
}