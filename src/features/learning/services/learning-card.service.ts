import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningCard, Profile } from "@/types/learning";

let learningCardsPromise: Promise<LearningCard[]> | null = null;
const profileListPromises = new Map<string, Promise<Record<string, Profile>>>();

export async function getLearningCards(
  supabase: SupabaseClient,
  { force = false }: { force?: boolean } = {},
) {
  if (force) learningCardsPromise = null;

  learningCardsPromise ??= fetchLearningCards(supabase).catch((error) => {
    learningCardsPromise = null;
    throw error;
  });

  return learningCardsPromise;
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

async function fetchLearningCards(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("learning_cards")
    .select("*")
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
