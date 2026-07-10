import type { LearningCategory } from "@/types/category";

export const categoryImageById: Record<string, string> = {
  coding: "/images/category/js.png",
  backend: "/images/category/springboot.png",
  database: "/images/category/net.png",
  architecture: "/images/category/net.png",
  devops: "/images/category/net.png",
  "ai-tools": "/images/category/other.png",
  debugging: "/images/category/wk_is.png",
  "practical-tips": "/images/category/other.png",
  "work-life": "/images/category/wk_is.png",
  career: "/images/category/inter_quest.png",
  teamwork: "/images/category/wk_is.png",
  "side-project": "/images/category/js.png",
  resources: "/images/category/other.png",
  thoughts: "/images/category/other.png",
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
  sub_field?: string | null;
}) {
  return (
    categoryImageForId(card.sub_field) ||
    categoryImageForId(card.category) ||
    categoryImageById.other
  );
}

export const defaultLearningCategories: LearningCategory[] = [
  {
    id: "coding",
    category: "技術實戰",
    name: "Coding / 程式開發",
    sort_order: 1,
    created_at: null,
  },
  {
    id: "backend",
    category: "技術實戰",
    name: "Backend / API",
    sort_order: 2,
    created_at: null,
  },
  {
    id: "database",
    category: "技術實戰",
    name: "Database / 資料庫",
    sort_order: 3,
    created_at: null,
  },
  {
    id: "architecture",
    category: "技術實戰",
    name: "System Design / 架構",
    sort_order: 4,
    created_at: null,
  },
  {
    id: "devops",
    category: "技術實戰",
    name: "DevOps / 部署",
    sort_order: 5,
    created_at: null,
  },
  {
    id: "ai-tools",
    category: "技術實戰",
    name: "AI / 開發工具",
    sort_order: 6,
    created_at: null,
  },
  {
    id: "debugging",
    category: "Programmer 日常",
    name: "Debug / 踩坑紀錄",
    sort_order: 7,
    created_at: null,
  },
  {
    id: "practical-tips",
    category: "Programmer 日常",
    name: "實用技巧",
    sort_order: 8,
    created_at: null,
  },
  {
    id: "work-life",
    category: "Programmer 日常",
    name: "Programmer 工作日常",
    sort_order: 9,
    created_at: null,
  },
  {
    id: "career",
    category: "Programmer 日常",
    name: "職涯 / 面試",
    sort_order: 10,
    created_at: null,
  },
  {
    id: "teamwork",
    category: "Programmer 日常",
    name: "團隊協作",
    sort_order: 11,
    created_at: null,
  },
  {
    id: "side-project",
    category: "作品與想法",
    name: "Side Project",
    sort_order: 12,
    created_at: null,
  },
  {
    id: "resources",
    category: "作品與想法",
    name: "資源分享",
    sort_order: 13,
    created_at: null,
  },
  {
    id: "thoughts",
    category: "作品與想法",
    name: "隨筆 / 其他",
    sort_order: 14,
    created_at: null,
  },
];
