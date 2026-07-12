"use client";

import dayjs from "dayjs";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  categoryImageForId,
  learningCardImage,
} from "@/features/category/constants";
import type { LearningCard, Profile } from "@/types/learning";

export type CategoryPlaylist = {
  category: string;
  categoryImage: string;
  cards: LearningCard[];
};

export function buildCategoryPlaylists(cards: LearningCard[]): CategoryPlaylist[] {
  const playlists = new Map<string, LearningCard[]>();

  for (const card of cards) {
    playlists.set(card.category, [
      ...(playlists.get(card.category) ?? []),
      card,
    ]);
  }

  return Array.from(playlists, ([category, categoryCards]) => ({
    category,
    categoryImage: categoryImageForId(category),
    cards: categoryCards,
  })).sort((left, right) => right.cards.length - left.cards.length);
}

export function buildSubFieldPlaylists(cards: LearningCard[]): CategoryPlaylist[] {
  const playlists = new Map<string, LearningCard[]>();

  for (const card of cards) {
    const subField = card.sub_field ?? "uncategorized";
    playlists.set(subField, [...(playlists.get(subField) ?? []), card]);
  }

  return Array.from(playlists, ([category, categoryCards]) => ({
    category,
    categoryImage: categoryImageForId(category),
    cards: categoryCards,
  })).sort((left, right) => right.cards.length - left.cards.length);
}

export function CategoryPlaylistGrid({
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
      {playlists.map((playlist, index) => (
        <CategoryPlaylistBox
          key={playlist.category}
          playlist={playlist}
          index={index}
          onSelect={onSelect}
        />
      ))}
    </section>
  );
}

function CategoryPlaylistBox({
  playlist,
  index,
  onSelect,
}: {
  playlist: CategoryPlaylist;
  index: number;
  onSelect: (category: string) => void;
}) {
  const imageUrl = playlist.categoryImage.trim();
  const coverCards = playlist.cards.slice(0, 3);
  const latestCard = playlist.cards[0];

  return (
    <button
      className="motion-card group text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      type="button"
      onClick={() => onSelect(playlist.category)}
    >
      <div className="relative h-56 overflow-hidden border border-stone-300 bg-stone-200 shadow-[0_10px_28px_rgba(26,26,26,0.06)] transition group-hover:-translate-y-1 group-hover:border-neutral-950 group-hover:shadow-[6px_6px_0_#1a1a1a] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 sm:h-60">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="h-full w-full object-contain"
              src={imageUrl}
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/35 via-transparent to-transparent" />
          </>
        ) : (
          coverCards.map((card, index) => (
            <div
              className="absolute inset-y-0 overflow-hidden border-l border-white/50 bg-[#eef4ee]"
              key={card.id}
              style={{
                left: `${index * 16}%`,
                right: `${(coverCards.length - index - 1) * 8}%`,
                zIndex: index + 1,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-full w-full object-cover object-top"
                src={learningCardImage(card)}
                alt=""
              />
            </div>
          ))
        )}
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

export function LearningCardGrid({
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
      {cards.map((card, index) => (
        <LearningCardLink
          card={card}
          key={card.id}
          index={index}
          profile={card.user_id ? profiles[card.user_id] : undefined}
        />
      ))}
    </section>
  );
}

function LearningCardLink({
  card,
  index,
  profile,
}: {
  card: LearningCard;
  index: number;
  profile?: Profile;
}) {
  const imageUrl = learningCardImage(card);

  return (
    <Link
      className="motion-card group overflow-hidden border border-stone-300 bg-white shadow-[0_10px_28px_rgba(26,26,26,0.05)] transition hover:-translate-y-1 hover:border-neutral-950 hover:shadow-[6px_6px_0_#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      href={`/learning/${card.slug ?? card.cloud_id ?? card.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="grid h-64 place-items-center overflow-hidden border-b border-stone-200 bg-[#eef4ee] text-5xl font-black text-emerald-900 sm:h-72 lg:h-64">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          src={imageUrl}
          alt={`${card.title} learning note`}
        />
      </div>
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase text-neutral-500">
          <p>
            {[card.category, card.sub_field, authorLabel(card.user_id, profile)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <time>{dayjs(card.learned_date).format("YYYY-MM-DD")}</time>
        </div>
        <h2 className="mb-3 text-xl font-black leading-tight tracking-normal text-neutral-950 sm:text-2xl">
          {card.title}
        </h2>
        <p className="line-clamp-3 text-base leading-relaxed text-neutral-600">
          {card.summary}
        </p>
      </div>
    </Link>
  );
}

export function LoadingGrid() {
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
          <div className="loading-shimmer h-64 border-b border-stone-200 sm:h-72 lg:h-64" />
          <div className="space-y-3 p-5">
            <div className="loading-shimmer h-3 w-20" />
            <div className="loading-shimmer h-8 w-3/4" />
            <div className="loading-shimmer h-4 w-full" />
            <div className="loading-shimmer h-4 w-2/3" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function ErrorState({
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

export function EmptyState({ canCreate }: { canCreate: boolean }) {
  const { t } = useTranslation();

  return (
    <div className="border border-dashed border-neutral-400 bg-white p-6 text-neutral-700 shadow-[0_10px_28px_rgba(26,26,26,0.04)] sm:p-8">
      <p className="text-2xl font-black text-neutral-950">
        {t("emptyWall")}
      </p>
      <p className="mt-2 max-w-xl leading-relaxed">
        {t("learningWallBody")}
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
