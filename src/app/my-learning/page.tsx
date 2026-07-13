import type { Metadata } from "next";
import { LearningWallClient } from "@/features/learning/components/LearningWallClient";

export const metadata: Metadata = {
  title: "我的學習",
  robots: { index: false, follow: false },
};

export default function MyLearningPage() {
  return <LearningWallClient scope="mine" />;
}
