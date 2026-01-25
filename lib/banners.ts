import { supabase } from "@/lib/supabase";

export async function getBanner(slug: string) {
  const { data, error } = await supabase
    .rpc("get_banner_by_slug", { p_slug: slug })
    .single();

  if (error) {
    console.error("BANNER RPC ERROR:", error);
    return null;
  }

  return data;
}
