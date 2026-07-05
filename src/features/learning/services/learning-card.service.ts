import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningCard, Profile } from "@/types/learning";

const learningCardsPromises = new Map<string, Promise<LearningCard[]>>();
const profileListPromises = new Map<string, Promise<Record<string, Profile>>>();

export async function getLearningCards(
  supabase: SupabaseClient,
  { force = false, userId }: { force?: boolean; userId?: string } = {},
) {
  const cacheKey = userId ?? "all";

  if (force) learningCardsPromises.delete(cacheKey);

  learningCardsPromises.set(
    cacheKey,
    learningCardsPromises.get(cacheKey) ??
      fetchLearningCards(supabase, userId).catch((error) => {
        learningCardsPromises.delete(cacheKey);
        throw error;
      }),
  );

  return learningCardsPromises.get(cacheKey)!;
}

export async function getProfilesByIds(
  supabase: SupabaseClient,
  userIds: string[],
) {
  const ids = Array.from(new Set(userIds)).sort();

  if (ids.length === 0) return {};

  const cacheKey = ids.join(",");
  profileListPromises.set(
    cacheKey,
    profileListPromises.get(cacheKey) ??
      fetchProfilesByIds(supabase, ids).catch((error) => {
        profileListPromises.delete(cacheKey);
        throw error;
      }),
  );

  return profileListPromises.get(cacheKey)!;
}

async function fetchLearningCards(supabase: SupabaseClient, userId?: string) {
  let query = supabase
    .from("learning_cards")
    .select("*");

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query
    .order("learned_date", { ascending: false })
    .returns<LearningCard[]>();

  if (error) throw error;

  return data ?? [];
}

async function fetchProfilesByIds(supabase: SupabaseClient, userIds: string[]) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds)
    .returns<Profile[]>();

  return Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]));
}
