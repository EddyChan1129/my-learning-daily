import { configureStore } from "@reduxjs/toolkit";
import todoUiReducer from "@/features/todo/stores/todoUiSlice";

export const store = configureStore({
  reducer: {
    todoUi: todoUiReducer,
  },
});
