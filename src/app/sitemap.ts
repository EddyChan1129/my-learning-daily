import type { MetadataRoute } from "next";
import { getLearningCards } from "@/features/learning/services/learning-card.service";
import { getSupabase } from "@/lib/supabase";
import { siteUrl } from "@/utils/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = ["/", "/contact-us"].map(
    (path) => ({ url: new URL(path, siteUrl).toString() }),
  );
  const supabase = getSupabase();

  if (!supabase) return staticPages;

  try {
    const cards = await getLearningCards(supabase, { force: true });

    return [
      ...staticPages,
      ...cards.map((card) => ({
        url: new URL(
          `/learning/${card.slug ?? card.cloud_id ?? card.id}`,
          siteUrl,
        ).toString(),
        lastModified: card.updated_at ?? card.created_at ?? card.learned_date,
      })),
    ];
  } catch {
    return staticPages;
  }
}
