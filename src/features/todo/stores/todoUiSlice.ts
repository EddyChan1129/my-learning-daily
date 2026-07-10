import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { TodoFilter, TodoUiState } from "@/types/todo";

const initialState: TodoUiState = {
  draftTitle: "",
  filter: "all",
};

const todoUiSlice = createSlice({
  name: "todoUi",
  initialState,
  reducers: {
    setDraftTitle(state: TodoUiState, action: PayloadAction<string>) {
      state.draftTitle = action.payload;
    },
    clearDraftTitle(state: TodoUiState) {
      state.draftTitle = "";
    },
    setFilter(state: TodoUiState, action: PayloadAction<TodoFilter>) {
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
