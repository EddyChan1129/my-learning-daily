"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { CardForm } from "@/components/CardForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase";
import type { LearningCard, LearningCardInput } from "@/types/learning";
import {
  formatLearningCardError,
  isUuid,
  slugify,
} from "@/utils/learning";
import { sanitizeContent } from "@/utils/content";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();

export function LearningDetail({ slug }: { slug: string }) {
  const [card, setCard] = useState<LearningCard | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCard() {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("learning_cards")
        .select("*")
        .eq(isUuid(slug) ? "id" : "slug", slug)
        .single();

      if (error) {
        setMessage(formatLearningCardError(error.message));
        return;
      }

      setCard(data);
    }

    loadCard();

    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, [slug]);

  async function updateCard(value: LearningCardInput) {
    if (!supabase || !card) return;

    const { data, error } = await supabase
      .from("learning_cards")
      .update({
        ...value,
        slug: slugify(value.title),
        updated_at: new Date().toISOString(),
      })
      .eq("id", card.id)
      .select()
      .single();

    if (error) throw error;

    setCard(data);
    setEditing(false);
  }

  async function deleteCard() {
    if (!supabase || !card || !confirm("Delete this learning card?")) return;

    const { error } = await supabase
      .from("learning_cards")
      .delete()
      .eq("id", card.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/";
  }

  const canEdit = Boolean(user && card && user.id === card.user_id);

  if (!supabase) {
    return (
      <main className="mx-auto w-[min(820px,calc(100%_-_32px))] py-8 sm:py-12">
        <Link className="inline-block font-bold text-neutral-600" href="/">
          Back
        </Link>
        <p className="mt-5 text-neutral-600">
          Add Supabase env vars to load learning cards.
        </p>
      </main>
    );
  }

  if (!card) {
    return (
      <main className="mx-auto w-[min(820px,calc(100%_-_32px))] py-8 sm:py-12">
        <Link className="inline-block font-bold text-neutral-600" href="/">
          Back
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
    <main className="mx-auto w-[min(820px,calc(100%_-_32px))] py-8 sm:py-12">
      <Link className="mb-5 inline-block font-bold text-neutral-600" href="/">
        Back
      </Link>

      {editing ? (
        <CardForm
          initialValue={formValue}
          submitLabel="Update card"
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
          {card.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="my-5 max-h-[420px] w-full rounded-lg object-cover"
              src={card.image_url}
              alt=""
            />
          ) : null}
          <div
            className="mt-6 text-lg text-neutral-950 [&_.content-image]:my-4 [&_.content-image]:max-h-[420px] [&_.content-image]:w-full [&_.content-image]:rounded-lg [&_.content-image]:object-cover [&_.text-large]:text-2xl"
            dangerouslySetInnerHTML={{ __html: sanitizeContent(card.content) }}
          />
          <p className="mt-7 text-sm text-neutral-600">
            Created: {card.created_at ? dayjs(card.created_at).format("YYYY-MM-DD") : "-"} · Updated:{" "}
            {card.updated_at ? dayjs(card.updated_at).format("YYYY-MM-DD") : "-"}
          </p>
          {canEdit ? (
            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={deleteCard}>
                Delete
              </Button>
            </div>
          ) : null}
        </Card>
      )}
    </main>
  );
}
