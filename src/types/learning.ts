export type LearningCard = {
  id: string;
  cloud_id: string | null;
  title: string;
  slug: string | null;
  category: string;
  sub_field: string | null;
  summary: string;
  content: string;
  learned_date: string;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  profiles?: Profile | null;
};

export type LearningCardInput = {
  title: string;
  category: string;
  sub_field: string;
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
