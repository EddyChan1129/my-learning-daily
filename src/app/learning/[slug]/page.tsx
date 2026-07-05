import { LearningDetail } from "@/components/common/LearningDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <LearningDetail slug={slug} />;
}
