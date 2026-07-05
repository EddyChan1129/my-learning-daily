import type { LearningCategory } from "@/features/category/types";

export const categoryImageById: Record<string, string> = {
  leetcode: "/images/category/leetcode.png",
  javascript: "/images/category/js.png",
  springboot: "/images/category/springboot.png",
  "spring boot": "/images/category/springboot.png",
  "interview question": "/images/category/inter_quest.png",
  security: "/images/category/security.png",
  networking: "/images/category/net.png",
  "working issues": "/images/category/wk_is.png",
  other: "/images/category/other.png",
};

export function categoryImageForId(id?: string | null) {
  if (!id) return "";

  return categoryImageById[id] ?? categoryImageById[id.toLowerCase()] ?? "";
}

export function learningCardImage(card: {
  category?: string | null;
  image_url?: string | null;
  sub_field?: string | null;
}) {
  const imageUrl = card.image_url?.trim();

  if (imageUrl && !imageUrl.endsWith("/no_img.png")) return imageUrl;

  return (
    categoryImageForId(card.sub_field) ||
    categoryImageForId(card.category) ||
    categoryImageById.other
  );
}

export const defaultLearningCategories: LearningCategory[] = [
  {
    id: "leetcode",
    category: "IT",
    name: "leetcode",
    sort_order: 1,
    created_at: null,
  },
  {
    id: "javascript",
    category: "IT",
    name: "javascript",
    sort_order: 2,
    created_at: null,
  },
  {
    id: "springboot",
    category: "IT",
    name: "springboot",
    sort_order: 3,
    created_at: null,
  },
  {
    id: "interview question",
    category: "IT",
    name: "interview question",
    sort_order: 4,
    created_at: null,
  },
  {
    id: "security",
    category: "IT",
    name: "security",
    sort_order: 5,
    created_at: null,
  },
  {
    id: "networking",
    category: "IT",
    name: "networking",
    sort_order: 6,
    created_at: null,
  },
  {
    id: "working issues",
    category: "IT",
    name: "working issues",
    sort_order: 7,
    created_at: null,
  },
  {
    id: "other",
    category: "Other",
    name: "other",
    sort_order: 1,
    created_at: null,
  },
];
