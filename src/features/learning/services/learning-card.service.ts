import type { SupabaseClient } from "@supabase/supabase-js";
import type { LearningCard, LearningComment } from "@/types/learning";
import {
  formatLearningCardError,
  isUuid,
} from "@/utils/learning";

const learningCardsPromises = new Map<string, Promise<LearningCard[]>>();
const learningCardPromises = new Map<string, Promise<LearningCard | null>>();
const learningCommentPromises = new Map<string, Promise<LearningComment[]>>();

export function invalidateLearningCards() {
  learningCardsPromises.clear();
}

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

export function getLearningCard(supabase: SupabaseClient, value: string) {
  const cacheKey = value;

  learningCardPromises.set(
    cacheKey,
    learningCardPromises.get(cacheKey) ??
      fetchLearningCard(supabase, value).finally(() => {
        learningCardPromises.delete(cacheKey);
      }),
  );

  return learningCardPromises.get(cacheKey)!;
}

export function getLearningComments(
  supabase: SupabaseClient,
  cardId: string,
  { force = false }: { force?: boolean } = {},
) {
  if (force) learningCommentPromises.delete(cardId);

  learningCommentPromises.set(
    cardId,
    learningCommentPromises.get(cardId) ??
      fetchLearningComments(supabase, cardId).finally(() => {
        learningCommentPromises.delete(cardId);
      }),
  );

  return learningCommentPromises.get(cardId)!;
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

async function fetchLearningCard(supabase: SupabaseClient, value: string) {
  const column = isUuid(value)
    ? "id"
    : /^\d+-\d{4}-\d{2}-\d{2}$/.test(value)
      ? "cloud_id"
      : "slug";
  const { data, error } = await supabase
    .from("learning_cards")
    .select("*")
    .eq(column, value)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<LearningCard[]>();

  if (error) {
    throw new Error(formatLearningCardError(error.message));
  }

  return data?.[0] ?? (await fetchLearningCardBySlugPrefix(supabase, value));
}

async function fetchLearningCardBySlugPrefix(
  supabase: SupabaseClient,
  value: string,
) {
  if (isUuid(value)) return null;

  const baseSlug = value.replace(/-\d+$/, "");
  const { data } = await supabase
    .from("learning_cards")
    .select("*")
    .ilike("slug", `${baseSlug}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<LearningCard[]>();

  return data?.[0] ?? null;
}

async function fetchLearningComments(
  supabase: SupabaseClient,
  cardId: string,
) {
  const { data, error } = await supabase
    .from("learning_comments")
    .select("*")
    .eq("card_id", cardId)
    .eq("viod", false)
    .order("created_at", { ascending: true })
    .returns<LearningComment[]>();

  if (error) throw error;

  return data ?? [];
}
