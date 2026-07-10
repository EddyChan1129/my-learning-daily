"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addTodo,
  deleteTodo,
  getTodos,
  toggleTodo,
} from "@/features/todo/services/todo.service";
import {
  getCurrentUser,
  setCurrentUserCache,
} from "@/features/auth/services/auth.service";
import {
  clearDraftTitle,
  setDraftTitle,
  setFilter,
} from "@/features/todo/stores/todoUiSlice";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { getSupabase } from "@/lib/supabase";
import type { RootState } from "@/types/store";
import type { TodoFilter, TodoItem } from "@/types/todo";
import { cn } from "@/utils/cn";

const supabase = getSupabase();
const filters: TodoFilter[] = ["all", "open", "done"];
const priorities = [1, 2, 3, 4] as const;

export function TodoListClient() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(() => !supabase);
  const [draftPriority, setDraftPriority] = useState<1 | 2 | 3 | 4>(3);
  const [draftDueDate, setDraftDueDate] = useState(() =>
    dayjs().format("YYYY-MM-DD"),
  );
  const todoQueryKey = ["todos", userId];
  const draftTitle = useAppSelector(
    (state: RootState) => state.todoUi.draftTitle,
  );
  const filter = useAppSelector((state: RootState) => state.todoUi.filter);
  const todosQuery = useQuery({
    queryKey: todoQueryKey,
    queryFn: getTodos,
    enabled: authReady && Boolean(userId),
  });
  const invalidateTodos = () =>
    queryClient.invalidateQueries({ queryKey: todoQueryKey });
  const addTodoMutation = useMutation({
    mutationFn: addTodo,
    onSuccess: invalidateTodos,
  });
  const toggleTodoMutation = useMutation({
    mutationFn: toggleTodo,
    onSuccess: invalidateTodos,
  });
  const deleteTodoMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: invalidateTodos,
  });
  const mutationError =
    addTodoMutation.error ??
    toggleTodoMutation.error ??
    deleteTodoMutation.error;
  const todos = todosQuery.data ?? [];
  const visibleTodos = filterTodos(
    [...todos].sort((a, b) => a.priority - b.priority),
    filter,
  );
  const doneCount = todos.filter((todo) => todo.completed).length;
  const isMutating =
    addTodoMutation.isPending ||
    toggleTodoMutation.isPending ||
    deleteTodoMutation.isPending;

  useEffect(() => {
    if (!supabase) return;

    getCurrentUser(supabase)
      .then((user) => setUserId(user?.id ?? null))
      .catch(() => setUserId(null))
      .finally(() => setAuthReady(true));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;

      setCurrentUserCache(session?.user ?? null);
      setUserId(session?.user.id ?? null);
      setAuthReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = draftTitle.trim();
    if (!title || !userId || !draftDueDate) return;

    addTodoMutation.mutate({
      title,
      priority: draftPriority,
      estimated_completion_date: draftDueDate,
    }, {
      onSuccess: () => {
        dispatch(clearDraftTitle());
        setDraftPriority(3);
        setDraftDueDate(dayjs().format("YYYY-MM-DD"));
      },
    });
  }

  return (
    <main className="page-shell min-h-screen pb-16 pt-32 sm:pt-36">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.88fr)_320px]">
        <div>
          <p className="text-sm font-black text-emerald-800">
            {t("todoEyebrow")}
          </p>
          <h1 className="mt-3 text-[clamp(44px,8vw,88px)] font-black leading-none tracking-normal text-neutral-950">
            {t("todoList")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-bold leading-relaxed text-neutral-600">
            {t("todoBody")}
          </p>
        </div>

        <Card className="rounded-none border-stone-300 p-5 shadow-[8px_8px_0_rgba(26,26,26,0.88)]">
          <p className="text-sm font-black uppercase text-emerald-800">
            {t("todoProgress")}
          </p>
          <p className="mt-3 text-5xl font-black text-neutral-950">
            {doneCount}/{todos.length}
          </p>
          <p className="mt-2 text-sm font-bold text-neutral-500">
            {t("todoProgressBody")}
          </p>
        </Card>
      </section>

      <Card className="mt-8 rounded-none border-stone-300 p-4 shadow-[8px_8px_0_rgba(26,26,26,0.88)] sm:p-5">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_140px_190px_auto] lg:items-end"
          onSubmit={handleSubmit}
        >
          <Label>
            {t("title")}
            <Input
              value={draftTitle}
              placeholder={t("todoPlaceholder")}
              onChange={(event) => dispatch(setDraftTitle(event.target.value))}
            />
          </Label>
          <Label>
            {t("todoPriority")}
            <Select
              value={draftPriority}
              onChange={(event) =>
                setDraftPriority(Number(event.target.value) as 1 | 2 | 3 | 4)
              }
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  P{priority}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            {t("todoDueDate")}
            <Input
              required
              type="date"
              value={draftDueDate}
              onChange={(event) => setDraftDueDate(event.target.value)}
            />
          </Label>
          <Button disabled={!userId || isMutating} type="submit">
            {isMutating ? t("saving") : t("todoAdd")}
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map((nextFilter) => (
            <button
              key={nextFilter}
              className={cn(
                "rounded-full border border-stone-200 px-4 py-2 text-sm font-black text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950",
                filter === nextFilter &&
                  "border-neutral-950 bg-neutral-950 text-white hover:text-white",
              )}
              type="button"
              onClick={() => dispatch(setFilter(nextFilter))}
            >
              {t(`todoFilter.${nextFilter}`)}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          {todosQuery.isLoading ? <TodoSkeleton /> : null}
          {todosQuery.isError ? (
            <p className="border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
              {t("todoLoadFailed")}
            </p>
          ) : null}
          {authReady && !userId ? (
            <p className="border border-dashed border-stone-300 p-4 text-sm font-bold text-neutral-500">
              {t("todoSignInRequired")}
            </p>
          ) : null}
          {mutationError ? (
            <p className="border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
              {mutationError.message}
            </p>
          ) : null}
          {userId && !todosQuery.isLoading && visibleTodos.length === 0 ? (
            <p className="border border-dashed border-stone-300 p-4 text-sm font-bold text-neutral-500">
              {t("todoEmpty")}
            </p>
          ) : null}
          {visibleTodos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              disabled={isMutating}
              onDelete={() => deleteTodoMutation.mutate(todo.id)}
              onToggle={() => toggleTodoMutation.mutate(todo)}
            />
          ))}
        </div>
      </Card>
    </main>
  );
}

function TodoRow({
  disabled,
  todo,
  onDelete,
  onToggle,
}: {
  disabled: boolean;
  todo: TodoItem;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  return (
    <article className="flex flex-col gap-3 border border-stone-200 bg-[#fffdf8] p-4 sm:flex-row sm:items-center sm:justify-between">
      <button
        className="flex min-w-0 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        disabled={disabled}
        type="button"
        onClick={onToggle}
      >
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full border border-neutral-950 text-sm font-black",
            todo.completed && "bg-neutral-950 text-white",
          )}
        >
          {todo.completed ? "✓" : ""}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block text-lg font-black text-neutral-950",
              todo.completed && "text-neutral-400 line-through",
            )}
          >
            {todo.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-black text-neutral-500">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5",
                priorityClassName(todo.priority),
              )}
            >
              P{todo.priority}
            </span>
            <time dateTime={todo.estimated_completion_date ?? undefined}>
              {t("todoDueDate")}: {todo.estimated_completion_date ?? "—"}
            </time>
          </span>
        </span>
      </button>
      <Button
        className="w-full sm:w-auto"
        disabled={disabled}
        type="button"
        variant="destructive"
        onClick={onDelete}
      >
        {t("delete")}
      </Button>
    </article>
  );
}

function TodoSkeleton() {
  return (
    <>
      {[0, 1, 2].map((item) => (
        <div
          className="loading-shimmer h-16 border border-stone-200"
          key={item}
        />
      ))}
    </>
  );
}

function filterTodos(todos: TodoItem[], filter: TodoFilter) {
  if (filter === "open") return todos.filter((todo) => !todo.completed);
  if (filter === "done") return todos.filter((todo) => todo.completed);
  return todos;
}

function priorityClassName(priority: TodoItem["priority"]) {
  if (priority === 1) return "border-red-300 bg-red-50 text-red-800";
  if (priority === 2) return "border-amber-300 bg-amber-50 text-amber-800";
  if (priority === 3) return "border-emerald-300 bg-emerald-50 text-emerald-800";
  return "border-stone-300 bg-stone-100 text-neutral-600";
}
