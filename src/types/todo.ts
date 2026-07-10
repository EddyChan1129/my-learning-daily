export type TodoFilter = "all" | "open" | "done";

export type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
  priority: 1 | 2 | 3 | 4;
  estimated_completion_date: string | null;
  created_at: string;
};

export type TodoInput = {
  title: string;
  priority: TodoItem["priority"];
  estimated_completion_date: string;
};

export type TodoUiState = {
  draftTitle: string;
  filter: TodoFilter;
};
