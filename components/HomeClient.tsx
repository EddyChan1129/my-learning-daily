"use client";

import dayjs from "dayjs";
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
  const [loading, setLoading] = useState(true);
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
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("learning_cards")
      .select("*")
      .order("learned_date", { ascending: false });

    if (error) {
      setMessage(formatLearningCardError(error.message));
      setLoading(false);
      return;
    }

    setCards(data ?? []);
    setMessage("");
    setLoading(false);
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

  const latestDate = cards[0]?.learned_date
    ? dayjs(cards[0].learned_date).format("MMM D")
    : "No entries";

  return (
    <main className="mx-auto w-[min(1160px,calc(100%_-_28px))] pb-16 pt-24 sm:w-[min(1160px,calc(100%_-_40px))] sm:pt-28">
      <section className="grid gap-6 pb-8 sm:pb-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="border-l-4 border-neutral-950 pl-4 sm:pl-6">
          <p className="mb-4 text-sm font-black text-emerald-800">
            Eddy 每日學習
          </p>
          <h1 className="max-w-3xl text-[clamp(40px,13vw,92px)] font-black leading-[0.88] tracking-normal text-neutral-950">
            One thing learned. Kept clearly.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-700 sm:text-xl">
            A personal wall for screenshots, short observations, and the ideas
            worth finding again.
          </p>
        </div>

        <div className="grid grid-cols-3 border-y border-neutral-950 bg-white text-neutral-950 shadow-[8px_8px_0_#1a1a1a] lg:grid-cols-1">
          <div className="border-r border-neutral-950 p-3 lg:border-b lg:border-r-0">
            <p className="text-xs font-black uppercase text-neutral-500">
              Cards
            </p>
            <p className="mt-1 text-3xl font-black">{cards.length}</p>
          </div>
          <div className="border-r border-neutral-950 p-3 lg:border-b lg:border-r-0">
            <p className="text-xs font-black uppercase text-neutral-500">
              Latest
            </p>
            <p className="mt-1 text-2xl font-black">{latestDate}</p>
          </div>
          <div className="p-3">
            <p className="text-xs font-black uppercase text-neutral-500">
              Mode
            </p>
            <p className="mt-1 text-2xl font-black">Daily</p>
          </div>
        </div>
      </section>

      {message ? <ErrorState message={message} onRetry={loadCards} /> : null}

      {user ? (
        <section className="mb-8 border border-neutral-950 bg-[#fffdf8] p-4 shadow-[6px_6px_0_#1a1a1a]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-neutral-950">Add today&apos;s card</p>
              <p className="text-sm text-neutral-600">
                Drop in an image, then write what it means.
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? "Close form" : "New learning card"}
            </Button>
          </div>
          {showForm ? (
            <CardForm
              initialValue={emptyCard}
              submitLabel="Create card"
              onSubmit={createCard}
            />
          ) : null}
        </section>
      ) : null}

      <div className="mb-4 flex items-end justify-between gap-4 border-b border-stone-300 pb-3">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral-950">
            Learning wall
          </h2>
          <p className="text-sm text-neutral-600">
            Newest notes first, built for quick scanning.
          </p>
        </div>
      </div>

      {loading ? <LoadingGrid /> : null}
      {!loading && cards.length > 0 ? <LearningCardGrid cards={cards} /> : null}
      {!loading && cards.length === 0 && !message ? (
        <EmptyState canCreate={Boolean(user)} />
      ) : null}
    </main>
  );
}

function LearningCardGrid({ cards }: { cards: LearningCard[] }) {
  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Learning cards"
    >
      {cards.map((card) => (
        <LearningCardLink card={card} key={card.id} />
      ))}
    </section>
  );
}

function LearningCardLink({ card }: { card: LearningCard }) {
  return (
    <Link
      className="group overflow-hidden border border-stone-300 bg-white shadow-[0_10px_28px_rgba(26,26,26,0.05)] transition hover:-translate-y-1 hover:border-neutral-950 hover:shadow-[6px_6px_0_#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      href={`/learning/${card.slug ?? card.id}`}
    >
      <div className="grid aspect-[4/3] place-items-center border-b border-stone-200 bg-[#eef4ee] text-5xl font-black text-emerald-900">
        {card.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            src={card.image_url}
            alt=""
          />
        ) : (
          <span>{card.category.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase text-neutral-500">
          <p>{card.category}</p>
          <time>{dayjs(card.learned_date).format("YYYY-MM-DD")}</time>
        </div>
        <h2 className="mb-3 text-2xl font-black leading-none tracking-normal text-neutral-950 sm:text-3xl">
          {card.title}
        </h2>
        <p className="line-clamp-3 text-base leading-relaxed text-neutral-600">
          {card.summary}
        </p>
      </div>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Loading learning cards"
    >
      {[0, 1, 2].map((item) => (
        <div
          className="overflow-hidden border border-stone-300 bg-white shadow-[0_10px_28px_rgba(26,26,26,0.04)]"
          key={item}
        >
          <div className="aspect-[4/3] animate-pulse border-b border-stone-200 bg-stone-200" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-20 animate-pulse bg-stone-200" />
            <div className="h-8 w-3/4 animate-pulse bg-stone-200" />
            <div className="h-4 w-full animate-pulse bg-stone-200" />
            <div className="h-4 w-2/3 animate-pulse bg-stone-200" />
          </div>
        </div>
      ))}
    </section>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mb-8 border border-red-300 bg-red-50 p-5 text-red-900 shadow-[6px_6px_0_#7f1d1d]">
      <p className="font-black">Could not load learning cards.</p>
      <p className="mt-1 text-sm">{message}</p>
      <Button className="mt-4" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="border border-dashed border-neutral-400 bg-white p-6 text-neutral-700 shadow-[0_10px_28px_rgba(26,26,26,0.04)] sm:p-8">
      <p className="text-2xl font-black text-neutral-950">
        Your first learning card starts here.
      </p>
      <p className="mt-2 max-w-xl leading-relaxed">
        Capture one screenshot, write the idea beneath it, and build a quiet
        archive of what you are learning.
      </p>
      {!canCreate ? (
        <Link
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          href="/login"
        >
          Login to create
        </Link>
      ) : null}
    </div>
  );
}
