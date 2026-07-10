import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningCategory } from "@/types/category";

let categoriesPromise: Promise<LearningCategory[]> | null = null;

export async function getCategories(supabase: SupabaseClient) {
  categoriesPromise ??= fetchCategories(supabase).catch((error) => {
    categoriesPromise = null;
    throw error;
  });

  return categoriesPromise;
}

async function fetchCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
    .returns<LearningCategory[]>();

  if (error) throw error;

  return data ?? [];
}
