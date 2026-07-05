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
