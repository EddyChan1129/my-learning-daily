import type { TodoItem } from "@/types/todo";

const TODOS_STORAGE_KEY = "knowbit_todos";

const DEFAULT_TODOS = [
  "redis",
  "auth",
  "MQ",
  "SEO",
  "stripe",
];

function seedTodos(): TodoItem[] {
  return DEFAULT_TODOS.map((title, index) => ({
    id: `seed-${index + 1}`,
    title,
    completed: false,
    createdAt: new Date(2026, 6, 10, 9, index).toISOString(),
  }));
}

function readTodos() {
  if (typeof window === "undefined") return seedTodos();

  const storedValue = localStorage.getItem(TODOS_STORAGE_KEY);
  if (!storedValue) {
    const seeded = seedTodos();
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(storedValue) as TodoItem[];
  } catch {
    const seeded = seedTodos();
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeTodos(todos: TodoItem[]) {
  localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
  return todos;
}

export async function getTodos() {
  return readTodos();
}

export async function addTodo(title: string) {
  const todo: TodoItem = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  return writeTodos([todo, ...readTodos()]);
}

export async function toggleTodo(todoId: string) {
  return writeTodos(
    readTodos().map((todo) =>
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo,
    ),
  );
}

export async function deleteTodo(todoId: string) {
  return writeTodos(readTodos().filter((todo) => todo.id !== todoId));
}
