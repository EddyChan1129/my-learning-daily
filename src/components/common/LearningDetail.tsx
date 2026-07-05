"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardForm } from "@/components/common/CardForm";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/features/category/hooks/useCategories";
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
import { sanitizeContent } from "@/utils/content";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();

export function LearningDetail({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [card, setCard] = useState<LearningCard | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
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

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadProfile(data.user);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user);
      if (!session?.user) setProfile(null);
    });

    return () => data.subscription.unsubscribe();
  }, [slug]);

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

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    setProfile(data);
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
    if (!supabase || !card || !confirm("Delete this learning card?")) return;

    const response = await fetch(`/api/learning-cards/${card.id}`, {
      headers: await authHeaders(),
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Delete failed.");
      return;
    }

    window.location.href = "/";
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
    summary: card.summary,
    content: card.content,
    learned_date: card.learned_date,
    image_url: card.image_url,
  };

  return (
    <main className="mx-auto w-[min(820px,calc(100%-32px))] py-8 sm:py-12">
      <Link
        className={buttonVariants({ className: "mb-5", variant: "secondary" })}
        href="/"
      >
        {t("back")}
      </Link>

      {editing ? (
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
      ) : (
        <Card className="p-5 sm:p-7">
          <p className="mb-2 text-sm font-bold uppercase text-neutral-600">
            {card.category}
          </p>
          <h1 className="mb-3 text-[clamp(36px,7vw,76px)] font-black leading-none tracking-normal text-neutral-950">
            {card.title}
          </h1>
          <time className="text-sm font-bold text-neutral-600">
            {dayjs(card.learned_date).format("YYYY-MM-DD")}
          </time>
          <div
            className="learning-content mt-6 text-lg text-neutral-950 [&_.text-large]:text-2xl"
            dangerouslySetInnerHTML={{ __html: sanitizeContent(card.content) }}
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
              <Button variant="destructive" onClick={deleteCard}>
                {t("delete")}
              </Button>
            </div>
          ) : null}
        </Card>
      )}
      <section className="mt-6 border border-neutral-950 bg-white p-4 shadow-[6px_6px_0_#1a1a1a] sm:p-5">
        <div className="mb-4">
          <h2 className="text-2xl font-black text-neutral-950">
            {t("comments")}
          </h2>
          <p className="text-sm text-neutral-600">
            {t("heroBody")}
          </p>
        </div>

        <div className="grid gap-3">
          <Input
            value={commentName}
            onChange={(event) => setCommentName(event.target.value)}
            placeholder={t("name")}
            maxLength={40}
          />
          <Textarea
            className="min-h-24"
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder={t("writeComment")}
            maxLength={1000}
          />
          {commentMessage ? (
            <p className="text-sm font-bold text-red-700">{commentMessage}</p>
          ) : null}
          <div className="flex justify-end">
            <Button onClick={createComment}>{t("postComment")}</Button>
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
                      onClick={() => deleteComment(comment.id)}
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
    </main>
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
