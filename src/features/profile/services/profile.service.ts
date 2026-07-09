import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "@/types/learning";

const profilePromises = new Map<string, Promise<Profile | null>>();

export async function getProfile(supabase: SupabaseClient, user: User) {
  profilePromises.set(
    user.id,
    profilePromises.get(user.id) ??
      fetchProfile(supabase, user).catch((error) => {
        profilePromises.delete(user.id);
        throw error;
      }),
  );

  return profilePromises.get(user.id)!;
}

export async function getProfilesByIds(
  supabase: SupabaseClient,
  userIds: string[],
) {
  const ids = Array.from(new Set(userIds)).sort();
  const missingIds = ids.filter((id) => !profilePromises.has(id));

  if (missingIds.length > 0) {
    const batchPromise = fetchProfilesByIds(supabase, missingIds).catch((error) => {
      missingIds.forEach((id) => profilePromises.delete(id));
      throw error;
    });

    missingIds.forEach((id) => {
      profilePromises.set(id, batchPromise.then((profiles) => profiles[id] ?? null));
    });
  }

  const profiles = await Promise.all(
    ids.map(async (id) => [id, await profilePromises.get(id)!] as const),
  );

  return Object.fromEntries(
    profiles.filter((entry): entry is readonly [string, Profile] =>
      Boolean(entry[1]),
    ),
  );
}

export function setProfileCache(profile: Profile) {
  profilePromises.set(profile.id, Promise.resolve(profile));
}

async function fetchProfile(supabase: SupabaseClient, user: User) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (data) return data;

  return {
    id: user.id,
    username:
      (user.user_metadata.username as string | undefined) ??
      user.email?.split("@")[0] ??
      "User",
    description: null,
    photo_url: null,
    created_at: null,
    updated_at: null,
  };
}

async function fetchProfilesByIds(supabase: SupabaseClient, userIds: string[]) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds)
    .returns<Profile[]>();

  return Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]));
}
