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

export type LearningCardInput = {
  title: string;
  category: string;
  summary: string;
  content: string;
  learned_date: string;
  image_url: string | null;
};

export type LearningComment = {
  id: string;
  card_id: string;
  author_name: string;
  body: string;
  created_at: string | null;
};
