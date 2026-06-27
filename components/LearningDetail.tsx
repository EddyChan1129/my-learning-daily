"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CardForm } from "@/components/CardForm";
import { LearningCard, LearningCardInput, slugify } from "@/lib/learningCards";
import { getSupabase } from "@/lib/supabase";
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
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .single();

      if (error) {
        setMessage(error.message);
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
      <main className="page detailPage">
        <Link className="backLink" href="/">
          Back
        </Link>
        <p className="notice">Add Supabase env vars to load learning cards.</p>
      </main>
    );
  }

  if (!card) {
    return (
      <main className="page detailPage">
        <Link className="backLink" href="/">
          Back
        </Link>
        <p className="notice">{message || "Loading..."}</p>
      </main>
    );
  }

  const formValue: LearningCardInput = {
    title: card.title,
    category: card.category,
    summary: card.summary,
    content: card.content,
    learned_date: card.learned_date,
    image_url: card.image_url ?? "",
  };

  return (
    <main className="page detailPage">
      <Link className="backLink" href="/">
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
        <article className="detail">
          <p className="tag">{card.category}</p>
          <h1>{card.title}</h1>
          <time>{card.learned_date}</time>
          <p className="summary">{card.summary}</p>
          {card.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="detailImage" src={card.image_url} alt="" />
          ) : null}
          <div className="content">
            {card.content.split("\n").map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
          <p className="meta">
            Created: {card.created_at ?? "-"} · Updated:{" "}
            {card.updated_at ?? "-"}
          </p>
          {canEdit ? (
            <div className="formActions">
              <button className="button secondary" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button className="button danger" onClick={deleteCard}>
                Delete
              </button>
            </div>
          ) : null}
        </article>
      )}
    </main>
  );
}
