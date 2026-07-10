"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BlockingOverlay } from "@/features/learning/components/BlockingOverlay";
import { LearningComments } from "@/features/learning/components/LearningComments";
import { LearningCardForm } from "@/features/learning/components/LearningCardForm";
import { LearningContent } from "@/features/learning/components/LearningContent";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getCurrentUser,
  setCurrentUserCache,
} from "@/features/auth/services/auth.service";
import { useCategories } from "@/features/category/hooks/useCategories";
import {
  getLearningCard,
  getLearningComments,
} from "@/features/learning/services/learning-card.service";
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

  async function loadProfile(currentUser: User) {
    if (!supabase) return;

    setProfile(await getProfile(supabase, currentUser));
  }

  useEffect(() => {
    async function loadCard() {
      if (!supabase) return;

      const cardData = await getLearningCard(supabase, slug);

      if (!cardData) {
        setMessage("Learning card not found.");
        return;
      }

      setCard(cardData);
      setComments(await getLearningComments(supabase, cardData.id));
      setCommentMessage("");
    }

    loadCard().catch((error) => {
      setMessage(error instanceof Error ? error.message : "Learning card failed.");
    });

    if (!supabase) return;

    getCurrentUser(supabase).then((currentUser) => {
      setUser(currentUser);
      if (currentUser) loadProfile(currentUser);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;

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

  async function loadComments(cardId: string) {
    if (!supabase) return;

    try {
      setComments(await getLearningComments(supabase, cardId, { force: true }));
      setCommentMessage("");
    } catch (error) {
      setCommentMessage(
        error instanceof Error ? error.message : "Learning comments failed.",
      );
    }
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
      <main className="page-shell min-h-screen pb-12 pt-32 sm:pt-36">
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
      <main className="page-shell min-h-screen pb-12 pt-32 sm:pt-36">
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
    <main className="page-shell pb-12 pt-32 sm:pb-12 sm:pt-36">
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
          <LearningCardForm
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
          {message ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
              {message}
            </p>
          ) : null}
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
        <LearningComments
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
