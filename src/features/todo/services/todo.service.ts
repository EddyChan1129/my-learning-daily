import { getSupabase } from "@/lib/supabase";
import type { TodoItem } from "@/types/todo";

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
    .select("id, title, completed, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<TodoItem[]>();

  if (error) throw error;

  return data ?? [];
}

export async function addTodo(title: string) {
  const supabase = requireSupabase();
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("todos")
    .insert({ title, user_id: userId })
    .select("id, title, completed, created_at")
    .single<TodoItem>();

  if (error) throw error;

  return data;
}

export async function toggleTodo(todo: TodoItem) {
  const { data, error } = await requireSupabase()
    .from("todos")
    .update({ completed: !todo.completed })
    .eq("id", todo.id)
    .select("id, title, completed, created_at")
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
