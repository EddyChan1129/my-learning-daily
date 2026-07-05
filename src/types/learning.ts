export type LearningCard = {
  id: string;
  cloud_id: string | null;
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
  profiles?: Profile | null;
};

export type LearningCategory = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string | null;
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
  viod: boolean;
};

export type Profile = {
  id: string;
  username: string;
  description: string | null;
  photo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};
