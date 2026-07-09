"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardForm } from "@/components/common/CardForm";
import { LearningContent } from "@/components/common/LearningContent";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getCurrentUser,
  setCurrentUserCache,
} from "@/features/auth/services/auth.service";
import { useCategories } from "@/features/category/hooks/useCategories";
import { getProfile } from "@/features/profile/services/profile.service";
import { getSupabase } from "@/lib/supabase";
import type {
  LearningCard,
  LearningCardInput,
  LearningComment,
  Profile,
} from "@/types/learning";
import {
  cloudinaryLearningFolder,
  cloudinaryLearningFolderFromUrl,
} from "@/utils/cloudinary";
import {
  formatLearningCardError,
  isUuid,
} from "@/utils/learning";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();

export function LearningDetail({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [card, setCard] = useState<LearningCard | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const deleteStartedRef = useRef(false);
  const [comments, setComments] = useState<LearningComment[]>([]);
  const categories = useCategories();
  const [commentName, setCommentName] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (localStorage.getItem("learning_comment_name") ??
        `訪客${Math.floor(100000 + Math.random() * 900000)}`),
  );
  const [commentBody, setCommentBody] = useState("");
  const [commentMessage, setCommentMessage] = useState("");

  useEffect(() => {
    async function loadCard() {
      if (!supabase) return;

      const column = isUuid(slug)
        ? "id"
        : /^\d+-\d{4}-\d{2}-\d{2}$/.test(slug)
          ? "cloud_id"
          : "slug";
      const { data, error } = await supabase
        .from("learning_cards")
        .select("*")
        .eq(column, slug)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        setMessage(formatLearningCardError(error.message));
        return;
      }

      const cardData = data?.[0] ?? (await loadCardBySlugPrefix(slug));

      if (!cardData) {
        setMessage("Learning card not found.");
        return;
      }

      setCard(cardData);
      await loadComments(cardData.id);
    }

    loadCard();

    if (!supabase) return;

    getCurrentUser(supabase).then((currentUser) => {
      setUser(currentUser);
      if (currentUser) loadProfile(currentUser);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserCache(session?.user ?? null);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user);
      if (!session?.user) setProfile(null);
      setAuthReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, [slug]);

  useEffect(() => {
    if (!deleting) return;

    function blockLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", blockLeave);
    return () => window.removeEventListener("beforeunload", blockLeave);
  }, [deleting]);

  async function loadCardBySlugPrefix(value: string) {
    if (!supabase || isUuid(value)) return null;

    const baseSlug = value.replace(/-\d+$/, "");
    const { data } = await supabase
      .from("learning_cards")
      .select("*")
      .ilike("slug", `${baseSlug}%`)
      .order("created_at", { ascending: false })
      .limit(1);

    return data?.[0] ?? null;
  }

  async function loadComments(cardId: string) {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("learning_comments")
      .select("*")
      .eq("card_id", cardId)
      .eq("viod", false)
      .order("created_at", { ascending: true });

    if (error) {
      setCommentMessage(error.message);
      return;
    }

    setComments(data ?? []);
    setCommentMessage("");
  }

  async function loadProfile(currentUser: User) {
    if (!supabase) return;

    setProfile(await getProfile(supabase, currentUser));
  }

  async function updateCard(value: LearningCardInput) {
    if (!supabase || !card) return;

    const response = await fetch(`/api/learning-cards/${card.id}`, {
      body: JSON.stringify(value),
      headers: await authHeaders(),
      method: "PATCH",
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error ?? "Save failed.");

    setCard(data.card);
    setEditing(false);
  }

  async function deleteCard() {
    if (!supabase || !card || deleteStartedRef.current) return;

    deleteStartedRef.current = true;

    if (!confirm("Delete this learning card?")) {
      deleteStartedRef.current = false;
      return;
    }

    setDeleting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/learning-cards/${card.id}`, {
        headers: await authHeaders(),
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Delete failed.");
        setDeleting(false);
        deleteStartedRef.current = false;
        return;
      }

      router.replace("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
      setDeleting(false);
      deleteStartedRef.current = false;
    }
  }

  async function createComment() {
    if (!supabase || !card) return;

    const authorName = commentName.trim() || "訪客";
    const body = commentBody.trim();
    if (!body) {
      setCommentMessage(t("writeComment"));
      return;
    }

    localStorage.setItem("learning_comment_name", authorName);

    const { error } = await supabase.from("learning_comments").insert({
      card_id: card.id,
      author_name: authorName,
      body,
    });

    if (error) {
      setCommentMessage(error.message);
      return;
    }

    setCommentBody("");
    await loadComments(card.id);
  }

  async function deleteComment(commentId: string) {
    if (!supabase || !card || !confirm("刪除留言？Delete this comment?")) return;

    const { error } = await supabase
      .from("learning_comments")
      .update({ viod: true })
      .eq("id", commentId);

    if (error) {
      setCommentMessage(error.message);
      return;
    }

    await loadComments(card.id);
  }

  const canEdit = Boolean(user && card && user.id === card.user_id);
  const showComments = authReady && (!user || !canEdit);

  if (!supabase) {
    return (
      <main className="mx-auto w-[min(820px,calc(100%-32px))] py-8 sm:py-12">
        <Link className={buttonVariants({ variant: "secondary" })} href="/">
          {t("back")}
        </Link>
        <p className="mt-5 text-neutral-600">
          請先加入 Supabase env vars。Add Supabase env vars to load learning cards.
        </p>
      </main>
    );
  }

  if (!card) {
    return (
      <main className="mx-auto w-[min(820px,calc(100%-32px))] py-8 sm:py-12">
        <Link className={buttonVariants({ variant: "secondary" })} href="/">
          {t("back")}
        </Link>
        <p className="mt-5 text-neutral-600">{message || "Loading..."}</p>
      </main>
    );
  }

  const formValue: LearningCardInput = {
    title: card.title,
    category: card.category,
    sub_field: card.sub_field ?? "",
    summary: card.summary,
    content: card.content,
    learned_date: card.learned_date,
    image_url: card.image_url,
  };

  return (
    <main className="mx-auto w-[min(820px,calc(100%-32px))] pb-12 pt-32 sm:pb-12 sm:pt-36">
      {deleting ? <BlockingOverlay message={t("deletingDoNotLeave")} /> : null}

      {editing ? (
        <>
          <Link
            className={buttonVariants({
              className: "mb-5",
              variant: "secondary",
            })}
            href="/"
          >
            {t("back")}
          </Link>
          <CardForm
            initialValue={formValue}
            submitLabel={t("save")}
            uploadFolder={
              cloudinaryLearningFolderFromUrl(card.image_url, card.id) ??
              cloudinaryLearningFolder(
                ownerName(user, profile),
                card.cloud_id ?? card.id,
              )
            }
            categories={categories}
            onSubmit={updateCard}
            onCancel={() => setEditing(false)}
          />
        </>
      ) : (
        <Card className="motion-card p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <p className="text-sm font-bold uppercase text-neutral-600">
              {[card.category, card.sub_field].filter(Boolean).join(" / ")}
            </p>
            <Link
              className={buttonVariants({
                className: "shrink-0",
                variant: "secondary",
              })}
              href="/"
            >
              {t("back")}
            </Link>
          </div>
          <h1 className="mb-3 text-5xl font-black leading-tight tracking-normal text-neutral-950 sm:text-6xl">
            {card.title}
          </h1>
          <time className="text-sm font-bold text-neutral-600">
            {dayjs(card.learned_date).format("YYYY-MM-DD")}
          </time>
          <LearningContent
            className="mt-6 text-lg text-neutral-950 [&_.text-large]:text-2xl"
            html={card.content}
          />
          <p className="mt-7 text-sm text-neutral-600">
            Created: {card.created_at ? dayjs(card.created_at).format("YYYY-MM-DD") : "-"} · Updated:{" "}
            {card.updated_at ? dayjs(card.updated_at).format("YYYY-MM-DD") : "-"}
          </p>
          {canEdit ? (
            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setEditing(true)}>
                {t("edit")}
              </Button>
              <Button
                disabled={deleting}
                variant="destructive"
                onClick={deleteCard}
              >
                {t("delete")}
              </Button>
            </div>
          ) : null}
        </Card>
      )}
      {showComments ? (
        <CommentSection
          commentBody={commentBody}
          commentMessage={commentMessage}
          commentName={commentName}
          comments={comments}
          user={user}
          onBodyChange={setCommentBody}
          onCommentDelete={deleteComment}
          onNameChange={setCommentName}
          onSubmit={createComment}
        />
      ) : null}
    </main>
  );
}

function CommentSection({
  commentBody,
  commentMessage,
  commentName,
  comments,
  user,
  onBodyChange,
  onCommentDelete,
  onNameChange,
  onSubmit,
}: {
  commentBody: string;
  commentMessage: string;
  commentName: string;
  comments: LearningComment[];
  user: User | null;
  onBodyChange: (value: string) => void;
  onCommentDelete: (commentId: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="mt-6 border border-neutral-950 bg-white p-4 shadow-[6px_6px_0_#1a1a1a] sm:p-5">
      <div className="mb-4">
        <h2 className="text-2xl font-black text-neutral-950">
          {t("comments")}
        </h2>
        <p className="text-sm text-neutral-600">{t("commentsBody")}</p>
      </div>

      <div className="grid gap-3">
        <Input
          value={commentName}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={t("name")}
          maxLength={40}
        />
        <Textarea
          className="min-h-24"
          value={commentBody}
          onChange={(event) => onBodyChange(event.target.value)}
          placeholder={t("writeComment")}
          maxLength={1000}
        />
        {commentMessage ? (
          <p className="text-sm font-bold text-red-700">{commentMessage}</p>
        ) : null}
        <div className="flex justify-end">
          <Button onClick={onSubmit}>{t("postComment")}</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {comments.length === 0 ? (
          <p className="border border-dashed border-stone-300 p-4 text-sm text-neutral-600">
            {t("emptyComments")}
          </p>
        ) : (
          comments.map((comment) => (
            <article
              className="border border-stone-200 bg-[#fffdf8] p-3"
              key={comment.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-neutral-950">
                    {comment.author_name}
                  </p>
                  <time className="text-xs font-bold text-neutral-500">
                    {comment.created_at
                      ? dayjs(comment.created_at).format("YYYY-MM-DD HH:mm")
                      : "-"}
                  </time>
                </div>
                {user ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onCommentDelete(comment.id)}
                  >
                    {t("delete")}
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-neutral-800">
                {comment.body}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function BlockingOverlay({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/35 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-72 items-center gap-3 rounded-lg border border-stone-200 bg-white px-5 py-4 text-sm font-black text-neutral-950 shadow-[8px_8px_0_#1a1a1a]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-950" />
        {message}
      </div>
    </div>
  );
}

function ownerName(user: User | null, profile: Profile | null) {
  return profile?.username ?? user?.email?.split("@")[0] ?? "user";
}

async function authHeaders() {
  const { data } = await supabase!.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  return headers;
}
