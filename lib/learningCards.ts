export type LearningCard = {
  id: string;
  title: string;
  slug: string | null;
  category: string;
  summary: string;
  content: string;
  learned_date: string;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
};

export type LearningCardInput = Pick<
  LearningCard,
  "title" | "category" | "summary" | "content" | "learned_date" | "image_url"
>;

export const emptyCard: LearningCardInput = {
  title: "",
  category: "",
  summary: "",
  content: "",
  learned_date: new Date().toISOString().slice(0, 10),
  image_url: "",
};

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug || "learning"}-${Date.now()}`;
}

export function validateCard(input: LearningCardInput) {
  if (!input.title.trim()) return "Title is required.";
  if (!input.category.trim()) return "Category is required.";
  if (!input.learned_date) return "Date learned is required.";
  if (!input.summary.trim()) return "Summary is required.";
  if (!input.content.trim()) return "Content is required.";
  return "";
}
