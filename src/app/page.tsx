import { LearningWallClient } from "@/features/learning/components/LearningWallClient";
import { getLearningCards } from "@/features/learning/services/learning-card.service";
import { getProfilesByIds } from "@/features/profile/services/profile.service";
import { getSupabase } from "@/lib/supabase";
import type { LearningCard, Profile } from "@/types/learning";

export const revalidate = 300;

export default async function Home() {
  const supabase = getSupabase();

  if (!supabase) return <LearningWallClient initialCards={[]} />;

  let initialCards: LearningCard[] | undefined;
  let initialProfiles: Record<string, Profile> | undefined;

  try {
    initialCards = await getLearningCards(supabase, { force: true });
    const userIds = initialCards
      .map((card) => card.user_id)
      .filter((id): id is string => Boolean(id));
    initialProfiles = await getProfilesByIds(supabase, userIds);
  } catch {}

  return (
    <LearningWallClient
      initialCards={initialCards}
      initialProfiles={initialProfiles}
    />
  );
}
