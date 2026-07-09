"use client";

import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LearningComment } from "@/types/learning";

export function LearningComments({
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
