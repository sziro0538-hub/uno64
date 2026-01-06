import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 16;

  if (!q.trim()) {
    return NextResponse.json({ 
      items: [], 
      total: 0, 
      page, 
      totalPages: 0 
    });
  }

  const text = q.toLowerCase().trim();
  
  // Витягуємо рарність
  let rarityFilter: string | null = null;
  if (text.includes("sth")) rarityFilter = "STH";
  else if (text.includes("chase")) rarityFilter = "CHASE";
  else if (text.includes("th")) rarityFilter = "TH";

  // Очищуємо текст від маркерів
  const cleaned = text
    .replace(/sth|chase|th/gi, "")
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  
  // ✅ Шукаємо в ТВОЇЙ таблиці hotwheels
  let query = supabase
    .from("hotwheels")  // ✅ Твоя таблиця!
    .select("id, name, series, year, rarity, image_url", { count: 'exact' })
    .range((page - 1) * limit, page * limit - 1)
    .order('name');

  // Фільтр по рарності
  if (rarityFilter) {
    query = query.eq("rarity", rarityFilter);
  }

  // Пошук по name + series
  if (cleaned) {
    if (words.length >= 2) {
      query = query.or(
        `name.ilike.%${cleaned}%,name.ilike.%${words[0]}%,name.ilike.%${words[1]}%,series.ilike.%${words[0]}%,series.ilike.%${words[1]}%`
      );
    } else {
      query = query.or(`name.ilike.%${cleaned}%,series.ilike.%${cleaned}%`);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Search error:", error);
    return NextResponse.json({ items: [], total: 0, page, totalPages: 0 });
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return NextResponse.json({ 
    items: data || [], 
    total: count || 0, 
    page, 
    totalPages 
  });
}
