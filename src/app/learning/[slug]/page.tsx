import type { Metadata } from "next";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { LearningDetail } from "@/features/learning/components/LearningDetail";
import { getLearningCard } from "@/features/learning/services/learning-card.service";
import { getSupabase } from "@/lib/supabase";
import { siteUrl } from "@/utils/site";

export const revalidate = 300;

type LearningPageProps = { params: Promise<{ slug: string }> };

const findLearningCard = cache(async (slug: string) => {
  const supabase = getSupabase();
  return supabase ? getLearningCard(supabase, slug) : null;
});

export async function generateMetadata({
  params,
}: LearningPageProps): Promise<Metadata> {
  const { slug } = await params;
  const card = await findLearningCard(slug);

  if (!card) return { title: "找不到學習紀錄", robots: { index: false } };

  const canonicalPath = `/learning/${card.slug ?? card.cloud_id ?? card.id}`;
  const image = card.image_url ?? "/images/logo/logo.png";

  return {
    title: card.title,
    description: card.summary,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      title: card.title,
      description: card.summary,
      url: canonicalPath,
      images: [image],
      publishedTime: card.created_at ?? card.learned_date,
      modifiedTime: card.updated_at ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: card.title,
      description: card.summary,
      images: [image],
    },
  };
}

export default async function Page({ params }: LearningPageProps) {
  const { slug } = await params;
  const card = await findLearningCard(slug);

  if (!card) notFound();

  const canonicalSlug = card.slug ?? card.cloud_id ?? card.id;
  if (slug !== canonicalSlug) redirect(`/learning/${canonicalSlug}`);

  const canonicalUrl = new URL(`/learning/${canonicalSlug}`, siteUrl).toString();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: card.title,
    description: card.summary,
    image: card.image_url
      ? [new URL(card.image_url, siteUrl).toString()]
      : undefined,
    datePublished: card.created_at ?? card.learned_date,
    dateModified: card.updated_at ?? card.created_at ?? card.learned_date,
    author: { "@type": "Organization", name: "KnowBit" },
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LearningDetail
        slug={canonicalSlug}
        initialCard={{ ...card, content: "" }}
      />
    </>
  );
}
