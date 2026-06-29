"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CardForm } from "@/components/CardForm";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase";
import type { LearningCard, LearningCardInput } from "@/types/learning";
import { emptyCard, formatLearningCardError, slugify } from "@/utils/learning";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();

export function HomeClient() {
  const [cards, setCards] = useState<LearningCard[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCards();

    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function loadCards() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("learning_cards")
      .select("*")
      .order("learned_date", { ascending: false });

    if (error) {
      setMessage(formatLearningCardError(error.message));
      return;
    }

    setCards(data ?? []);
  }

  async function createCard(value: LearningCardInput) {
    if (!supabase || !user) return;

    const { error } = await supabase.from("learning_cards").insert({
      ...value,
      slug: slugify(value.title),
      user_id: user.id,
    });

    if (error) throw error;

    setShowForm(false);
    await loadCards();
  }

  return (
    <main className="mx-auto w-[min(1120px,calc(100%_-_32px))] py-8 sm:py-12">
      <section className="pb-8 pt-10">
        <div>
          <p className="mb-2 text-sm font-bold uppercase text-neutral-600">
            Eddy 每日學習
          </p>
          <h1 className="mb-3 max-w-3xl text-[clamp(34px,6vw,72px)] font-black leading-none tracking-normal text-neutral-950">
            每天留低一張學習卡。
          </h1>
          <p className="max-w-2xl text-xl text-neutral-600">
            我係 Eddy，呢度記錄每日學到的前端、產品、工具同生活知識。
            每張卡都係一個小重點，方便之後重溫。
          </p>
        </div>
      </section>

      {message ? <p className="mb-5 text-neutral-600">{message}</p> : null}

      {user ? (
        <section className="mb-7">
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Close form" : "New learning card"}
          </Button>
          {showForm ? (
            <CardForm
              initialValue={emptyCard}
              submitLabel="Create card"
              onSubmit={createCard}
            />
          ) : null}
        </section>
      ) : null}

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Learning cards"
      >
        {cards.map((card) => (
          <Link
            className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-[0_10px_30px_rgba(26,26,26,0.06)] transition hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(26,26,26,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            href={`/learning/${card.slug ?? card.id}`}
            key={card.id}
          >
            <div className="grid min-h-44 place-items-center bg-stone-100 text-4xl font-black text-neutral-950">
              {card.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="h-56 w-full object-cover"
                  src={card.image_url}
                  alt=""
                />
              ) : (
                <span>{card.category.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="p-4">
              <p className="mb-2 text-sm font-bold uppercase text-neutral-600">
                {card.category}
              </p>
              <h2 className="mb-2 text-2xl font-black leading-tight text-neutral-950">
                {card.title}
              </h2>
              <p className="text-neutral-600">{card.summary}</p>
              <time className="mt-4 block text-sm font-bold text-neutral-600">
                {card.learned_date}
              </time>
            </div>
          </Link>
        ))}
      </section>

      {cards.length === 0 ? (
        <p className="mt-6 text-neutral-600">No learning cards yet.</p>
      ) : null}
    </main>
  );
}
