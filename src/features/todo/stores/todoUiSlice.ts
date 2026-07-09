import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { TodoFilter } from "@/features/todo/types";

type TodoUiState = {
  draftTitle: string;
  filter: TodoFilter;
};

const initialState: TodoUiState = {
  draftTitle: "",
  filter: "all",
};

const todoUiSlice = createSlice({
  name: "todoUi",
  initialState,
  reducers: {
    setDraftTitle(state, action: PayloadAction<string>) {
      state.draftTitle = action.payload;
    },
    clearDraftTitle(state) {
      state.draftTitle = "";
    },
    setFilter(state, action: PayloadAction<TodoFilter>) {
      state.filter = action.payload;
    },
  },
});

export const {
  clearDraftTitle,
  setDraftTitle,
  setFilter,
} = todoUiSlice.actions;

export default todoUiSlice.reducer;
