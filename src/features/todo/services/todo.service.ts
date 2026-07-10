import { getSupabase } from "@/lib/supabase";
import type { TodoInput, TodoItem } from "@/types/todo";

const todoColumns =
  "id, title, completed, priority, estimated_completion_date, created_at";

function requireSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  return supabase;
}

async function getUserId() {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error || !data.user) throw new Error("Please sign in to manage todos.");

  return data.user.id;
}

export async function getTodos() {
  const supabase = requireSupabase();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("todos")
    .select(todoColumns)
    .eq("user_id", userId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<TodoItem[]>();

  if (error) throw error;

  return data ?? [];
}

export async function addTodo(input: TodoInput) {
  const supabase = requireSupabase();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("todos")
    .insert({ ...input, user_id: userId })
    .select(todoColumns)
    .single<TodoItem>();

  if (error) throw error;

  return data;
}

export async function toggleTodo(todo: TodoItem) {
  const { data, error } = await requireSupabase()
    .from("todos")
    .update({ completed: !todo.completed })
    .eq("id", todo.id)
    .select(todoColumns)
    .single<TodoItem>();

  if (error) throw error;

  return data;
}

export async function deleteTodo(todoId: string) {
  const { error } = await requireSupabase()
    .from("todos")
    .delete()
    .eq("id", todoId);

  if (error) throw error;
}
