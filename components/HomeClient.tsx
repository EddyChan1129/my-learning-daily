"use client";

import dayjs from "dayjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CardForm } from "@/components/CardForm";
import { Button, buttonVariants } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase";
import type {
  LearningCard,
  LearningCardInput,
  LearningCategory,
  Profile,
} from "@/types/learning";
import { cloudinaryLearningFolder } from "@/utils/cloudinary";
import {
  defaultLearningCategories,
  emptyCard,
  formatLearningCardError,
  readableLearningId,
  slugify,
} from "@/utils/learning";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();

export function HomeClient() {
  const { t } = useTranslation();
  const [cards, setCards] = useState<LearningCard[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [draftUploadId, setDraftUploadId] = useState(() =>
    readableLearningId([], dayjs().format("YYYY-MM-DD")),
  );
  const [categories, setCategories] = useState(defaultLearningCategories);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadCards();
    loadCategories();

    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) loadCurrentProfile(data.user);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadCurrentProfile(session.user);
      if (!session?.user) setCurrentProfile(null);
    });

    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    await loadProfiles(data ?? []);
    setMessage("");
    setLoading(false);
  }

  async function loadProfiles(nextCards: LearningCard[]) {
    if (!supabase) return;

    const userIds = Array.from(
      new Set(nextCards.map((card) => card.user_id).filter(Boolean)),
    ) as string[];
    if (userIds.length === 0) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    setProfiles(
      Object.fromEntries((data ?? []).map((profile) => [profile.id, profile])),
    );
  }

  async function loadCategories() {
    if (!supabase) return;

    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .returns<LearningCategory[]>();

    if (data?.length) setCategories(data);
  }

  async function loadCurrentProfile(currentUser: User) {
    if (!supabase) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    setCurrentProfile(data);
  }

  async function createCard(value: LearningCardInput) {
    if (!supabase || !user) return;

    const { error } = await supabase.from("learning_cards").insert({
      ...value,
      cloud_id: draftUploadId,
      slug: slugify(value.title),
      user_id: user.id,
    });

    if (error) throw error;

    setShowForm(false);
    setSelectedCategory(null);
    setDraftUploadId(
      readableLearningId(cards, dayjs().format("YYYY-MM-DD")),
    );
    await loadCards();
  }

  function toggleForm() {
    if (!showForm) {
      setDraftUploadId(
        readableLearningId(cards, dayjs().format("YYYY-MM-DD")),
      );
    }
    setShowForm(!showForm);
  }

  const latestDate = cards[0]?.learned_date
    ? dayjs(cards[0].learned_date).format("MMM D")
    : "-";
  const contributorCount = new Set(cards.map((card) => card.user_id ?? "guest"))
    .size;
  const ownerName = currentProfile?.username ?? user?.email?.split("@")[0];
  const wallTitle = ownerName ? `${ownerName}讀書生活` : t("dailyWall");
  const wallSubtitle = ownerName ? `${ownerName} Study Life` : "Study Life";
  const categoryPlaylists = buildCategoryPlaylists(cards);
  const visibleCards = selectedCategory
    ? cards.filter((card) => card.category === selectedCategory)
    : cards;

  return (
    <main className="relative mx-auto w-[min(1160px,calc(100%-28px))] border-x border-stone-300 px-4 pb-16 pt-24 shadow-[inset_1px_0_0_rgba(255,255,255,0.75),inset_-1px_0_0_rgba(255,255,255,0.75)] sm:w-[min(1160px,calc(100%-40px))] sm:px-8 sm:pt-28">
      <section className="grid gap-6 pb-8 sm:pb-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div className="border-l border-neutral-950 pl-4 sm:pl-6">
          <p className="mb-4 text-sm font-black text-emerald-800">
            {wallTitle}
          </p>
          <h1 className="max-w-3xl text-[clamp(40px,13vw,92px)] font-black leading-[0.88] tracking-normal text-neutral-950">
            {wallTitle}
            <span className="mt-2 block text-[0.38em] leading-none text-neutral-500">
              {wallSubtitle}
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-700 sm:text-xl">
            {t("heroBody")}
          </p>
        </div>

        <div className="grid grid-cols-3 border border-stone-300 bg-white text-neutral-950 shadow-[6px_6px_0_rgba(26,26,26,0.88)] lg:grid-cols-1">
          <div className="border-r border-stone-300 p-3 lg:border-b lg:border-r-0">
            <p className="text-xs font-black uppercase text-neutral-500">
              {t("cards")}
            </p>
            <p className="mt-1 text-3xl font-black">{cards.length}</p>
          </div>
          <div className="border-r border-stone-300 p-3 lg:border-b lg:border-r-0">
            <p className="text-xs font-black uppercase text-neutral-500">
              {t("people")}
            </p>
            <p className="mt-1 text-3xl font-black">{contributorCount}</p>
          </div>
          <div className="p-3">
            <p className="text-xs font-black uppercase text-neutral-500">
              {t("latest")}
            </p>
            <p className="mt-1 text-2xl font-black">{latestDate}</p>
          </div>
        </div>
      </section>

      {message ? <ErrorState message={message} onRetry={loadCards} /> : null}

      {user ? (
        <section className="mb-8 border border-stone-300 bg-[#fffdf8] p-4 shadow-[6px_6px_0_rgba(26,26,26,0.88)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-neutral-950">{t("addCard")}</p>
              <p className="text-sm text-neutral-600">{t("heroBody")}</p>
            </div>
            <Button onClick={toggleForm}>
              {showForm ? t("close") : t("newCard")}
            </Button>
          </div>
          {showForm ? (
            <CardForm
              initialValue={emptyCard}
              submitLabel={t("create")}
              uploadFolder={cloudinaryLearningFolder(
                currentProfile?.username ?? user.email?.split("@")[0] ?? "user",
                draftUploadId,
              )}
              categories={categories}
              onSubmit={createCard}
            />
          ) : null}
        </section>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-3">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral-950">
            {selectedCategory ?? t("learningWall")}
          </h2>
          <p className="text-sm text-neutral-600">
            {selectedCategory
              ? `${visibleCards.length} learning card${visibleCards.length === 1 ? "" : "s"}`
              : t("heroBody")}
          </p>
        </div>
        {selectedCategory ? (
          <Button variant="secondary" onClick={() => setSelectedCategory(null)}>
            All categories
          </Button>
        ) : null}
      </div>

      {loading ? <LoadingGrid /> : null}
      {!loading && cards.length > 0 && !selectedCategory ? (
        <CategoryPlaylistGrid
          playlists={categoryPlaylists}
          onSelect={setSelectedCategory}
        />
      ) : null}
      {!loading && selectedCategory ? (
        <LearningCardGrid cards={visibleCards} profiles={profiles} />
      ) : null}
      {!loading && cards.length === 0 && !message ? (
        <EmptyState canCreate={Boolean(user)} />
      ) : null}
    </main>
  );
}

type CategoryPlaylist = {
  category: string;
  cards: LearningCard[];
};

function buildCategoryPlaylists(cards: LearningCard[]): CategoryPlaylist[] {
  const playlists = new Map<string, LearningCard[]>();

  for (const card of cards) {
    playlists.set(card.category, [
      ...(playlists.get(card.category) ?? []),
      card,
    ]);
  }

  return Array.from(playlists, ([category, categoryCards]) => ({
    category,
    cards: categoryCards,
  })).sort((left, right) => right.cards.length - left.cards.length);
}

function CategoryPlaylistGrid({
  playlists,
  onSelect,
}: {
  playlists: CategoryPlaylist[];
  onSelect: (category: string) => void;
}) {
  return (
    <section
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Learning categories"
    >
      {playlists.map((playlist) => (
        <CategoryPlaylistBox
          key={playlist.category}
          playlist={playlist}
          onSelect={onSelect}
        />
      ))}
    </section>
  );
}

function CategoryPlaylistBox({
  playlist,
  onSelect,
}: {
  playlist: CategoryPlaylist;
  onSelect: (category: string) => void;
}) {
  const coverCards = playlist.cards.slice(0, 3);
  const latestCard = playlist.cards[0];

  return (
    <button
      className="group text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
      type="button"
      onClick={() => onSelect(playlist.category)}
    >
      <div className="relative h-56 overflow-hidden border border-stone-300 bg-stone-200 shadow-[0_10px_28px_rgba(26,26,26,0.06)] transition group-hover:-translate-y-1 group-hover:border-neutral-950 group-hover:shadow-[6px_6px_0_#1a1a1a] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 sm:h-60">
        {coverCards.map((card, index) => (
          <div
            className="absolute inset-y-0 overflow-hidden border-l border-white/50 bg-[#eef4ee]"
            key={card.id}
            style={{
              left: `${index * 16}%`,
              right: `${(coverCards.length - index - 1) * 8}%`,
              zIndex: index + 1,
            }}
          >
            {card.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="h-full w-full object-cover object-top"
                src={card.image_url}
                alt=""
              />
            ) : (
              <div className="grid h-full place-items-center text-5xl font-black text-emerald-900">
                {card.category.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        <div className="absolute bottom-3 right-3 z-10 border border-neutral-950 bg-neutral-950/85 px-3 py-1 text-sm font-black text-white">
          {playlist.cards.length} cards
        </div>
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-black leading-none text-neutral-950">
          {playlist.category}
        </h3>
        <p className="mt-1 text-sm font-bold text-neutral-500">
          {latestCard?.learned_date
            ? `Updated ${dayjs(latestCard.learned_date).format("YYYY-MM-DD")}`
            : "View category"}
        </p>
        <p className="mt-1 text-sm font-black text-neutral-700">
          View learning cards
        </p>
      </div>
    </button>
  );
}

function LearningCardGrid({
  cards,
  profiles,
}: {
  cards: LearningCard[];
  profiles: Record<string, Profile>;
}) {
  return (
    <section
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Learning cards"
    >
      {cards.map((card) => (
        <LearningCardLink
          card={card}
          key={card.id}
          profile={card.user_id ? profiles[card.user_id] : undefined}
        />
      ))}
    </section>
  );
}

function LearningCardLink({
  card,
  profile,
}: {
  card: LearningCard;
  profile?: Profile;
}) {
  return (
    <Link
      className="group overflow-hidden border border-stone-300 bg-white shadow-[0_10px_28px_rgba(26,26,26,0.05)] transition hover:-translate-y-1 hover:border-neutral-950 hover:shadow-[6px_6px_0_#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      href={`/learning/${card.cloud_id ?? card.id}`}
    >
      <div className="grid h-64 place-items-center overflow-hidden border-b border-stone-200 bg-[#eef4ee] text-5xl font-black text-emerald-900 sm:h-72 lg:h-64">
        {card.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            src={card.image_url}
            alt=""
          />
        ) : (
          <span>{card.category.slice(0, 2).toUpperCase()}</span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase text-neutral-500">
          <p>
            {card.category} · {authorLabel(card.user_id, profile)}
          </p>
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
          <div className="h-64 animate-pulse border-b border-stone-200 bg-stone-200 sm:h-72 lg:h-64" />
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
  const { t } = useTranslation();

  return (
    <div className="border border-dashed border-neutral-400 bg-white p-6 text-neutral-700 shadow-[0_10px_28px_rgba(26,26,26,0.04)] sm:p-8">
      <p className="text-2xl font-black text-neutral-950">
        {t("emptyWall")}
      </p>
      <p className="mt-2 max-w-xl leading-relaxed">
        {t("heroBody")}
      </p>
      {!canCreate ? (
        <Link
          className={buttonVariants({ className: "mt-5" })}
          href="/login"
        >
          {t("login")} / {t("register")}
        </Link>
      ) : null}
    </div>
  );
}

function authorLabel(userId: string | null, profile?: Profile) {
  if (profile) return profile.username;
  if (!userId) return "訪客 Guest";
  return `作者 ${userId.slice(0, 6)}`;
}
