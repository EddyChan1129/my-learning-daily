export type TodoFilter = "all" | "open" | "done";

export type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export type TodoUiState = {
  draftTitle: string;
  filter: TodoFilter;
};
