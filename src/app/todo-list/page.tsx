import type { Metadata } from "next";
import { TodoListClient } from "@/features/todo/components/TodoListClient";

export const metadata: Metadata = {
  title: "待辦清單",
  robots: { index: false, follow: false },
};

export default function TodoListPage() {
  return <TodoListClient />;
}
