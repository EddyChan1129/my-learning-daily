export type TodoFilter = "all" | "open" | "done";

export type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
};

export type TodoUiState = {
  draftTitle: string;
  filter: TodoFilter;
};
