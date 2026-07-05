import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningCategory } from "@/features/category/types";

export async function getCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .returns<LearningCategory[]>();

  if (error) throw error;

  return data ?? [];
}
