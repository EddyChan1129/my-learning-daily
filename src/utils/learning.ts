import { z } from "zod";
import type {
  LearningCard,
  LearningCardInput,
} from "@/types/learning";
import { contentHasImage, contentText } from "@/utils/content";

export const learningCardSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  category: z.string().trim().min(1, "Category is required."),
  learned_date: z.string().min(1, "Date learned is required."),
  summary: z.string(),
  content: z.string().trim().min(1, "Content is required."),
  image_url: z.string().nullable(),
});

export const emptyCard: LearningCardInput = {
  title: "",
  category: "",
  summary: "",
  content: "",
  learned_date: new Date().toISOString().slice(0, 10),
  image_url: null,
};

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "learning"}-${Date.now()}`;
}

export function readableLearningId(cards: LearningCard[], date: string) {
  const suffix = `-${date}`;
  const maxId = Math.max(
    0,
    ...cards
      .map((card) => card.cloud_id ?? card.id)
      .filter((value) => value.endsWith(suffix))
      .map((value) => Number(value.slice(0, -suffix.length)))
      .filter(Number.isFinite),
  );

  return `${maxId + 1}-${date}`;
}

export function validateCard(input: LearningCardInput) {
  const result = learningCardSchema
    .extend({
      content: z
        .string()
        .refine((value) => contentText(value).trim().length > 0, {
          message: "Content is required.",
        })
        .refine((value) => contentHasImage(value) || Boolean(input.image_url), {
          message: "At least one image is required.",
        }),
    })
    .safeParse(input);
  return result.success ? "" : result.error.issues[0]?.message ?? "Invalid form.";
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function formatLearningCardError(message: string) {
  if (message.includes("public.learning_cards")) {
    return "Learning cards table is not set up yet. Run supabase/learning_cards.sql in Supabase SQL Editor.";
  }

  return message;
}
