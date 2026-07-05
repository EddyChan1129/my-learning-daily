import type { SupabaseClient, User } from "@supabase/supabase-js";

let currentUserPromise: Promise<User | null> | null = null;

export async function getCurrentUser(supabase: SupabaseClient) {
  currentUserPromise ??= supabase.auth
    .getUser()
    .then(({ data }) => data.user)
    .catch((error) => {
      currentUserPromise = null;
      throw error;
    });

  return currentUserPromise;
}

export function setCurrentUserCache(user: User | null) {
  currentUserPromise = Promise.resolve(user);
}
