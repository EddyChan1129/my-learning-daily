"use client";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LearningCardForm } from "@/features/learning/components/LearningCardForm";
import { Button } from "@/components/ui/button";
import {
  getCurrentUser,
  setCurrentUserCache,
} from "@/features/auth/services/auth.service";
import { useCategories } from "@/features/category/hooks/useCategories";
import { getLearningCards } from "@/features/learning/services/learning-card.service";
import {
  CategoryPlaylistGrid,
  EmptyState,
  ErrorState,
  LearningCardGrid,
  LoadingGrid,
  buildCategoryPlaylists,
  buildSubFieldPlaylists,
} from "@/features/learning/components/LearningWallSections";
import {
  getProfile,
  getProfilesByIds,
} from "@/features/profile/services/profile.service";
import { getSupabase } from "@/lib/supabase";
import type {
  LearningCard,
  LearningCardInput,
  Profile,
} from "@/types/learning";
import { cloudinaryLearningFolder } from "@/utils/cloudinary";
import {
  emptyCard,
  formatLearningCardError,
  readableLearningId,
  slugify,
} from "@/utils/learning";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();
type HomeScope = "all" | "mine";

export function LearningWallClient({ scope = "all" }: { scope?: HomeScope }) {
  const { t } = useTranslation();
  const isMyLearning = scope === "mine";
  const [cards, setCards] = useState<LearningCard[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [showForm, setShowForm] = useState(false);
  const [draftUploadId, setDraftUploadId] = useState(() =>
    readableLearningId([], dayjs().format("YYYY-MM-DD")),
  );
  const categories = useCategories();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubField, setSelectedSubField] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    if (!isMyLearning) loadCards();

    getCurrentUser(supabase).then((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadCurrentProfile(currentUser);
        if (isMyLearning) loadCards(currentUser.id);
        return;
      }

      if (isMyLearning) {
        setCards([]);
        setProfiles({});
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;

      const nextUser = session?.user ?? null;

      setCurrentUserCache(nextUser);
      setUser(nextUser);
      if (nextUser) {
        loadCurrentProfile(nextUser);
        if (isMyLearning) loadCards(nextUser.id, { force: true });
        return;
      }

      setCurrentProfile(null);
      if (isMyLearning) {
        setCards([]);
        setProfiles({});
        setLoading(false);
      }
    });

    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyLearning]);

  async function loadCards(
    userId?: string,
    { force = false }: { force?: boolean } = {},
  ) {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await getLearningCards(supabase, { force, userId });

      setCards(data);
      await loadProfiles(data);
      setMessage("");
    } catch (error) {
      setMessage(
        formatLearningCardError(
          error instanceof Error ? error.message : "Learning cards failed.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProfiles(nextCards: LearningCard[]) {
    if (!supabase) return;

    const userIds = Array.from(
      new Set(nextCards.map((card) => card.user_id).filter(Boolean)),
    ) as string[];
    if (userIds.length === 0) return;

    setProfiles(await getProfilesByIds(supabase, userIds));
  }

  async function loadCurrentProfile(currentUser: User) {
    if (!supabase) return;

    setCurrentProfile(await getProfile(supabase, currentUser));
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
    setSelectedSubField(null);
    setDraftUploadId(
      readableLearningId(cards, dayjs().format("YYYY-MM-DD")),
    );
    await loadCards(isMyLearning ? user.id : undefined, { force: true });
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
  const wallEyebrow =
    isMyLearning && ownerName ? `${ownerName} · ${t("myLearning")}` : t("dailyPrompt");
  const categoryPlaylists = buildCategoryPlaylists(cards);
  const subFieldPlaylists = selectedCategory
    ? buildSubFieldPlaylists(
        cards.filter((card) => card.category === selectedCategory),
      )
    : [];
  const visibleCards = selectedCategory
    ? cards.filter(
        (card) =>
          card.category === selectedCategory &&
          (!selectedSubField ||
            (card.sub_field ?? "uncategorized") === selectedSubField),
      )
    : cards;

  return (
    <main className="relative mx-auto w-[min(1160px,calc(100%-28px))] border-x border-stone-300 px-4 pb-16 pt-32 shadow-[inset_1px_0_0_rgba(255,255,255,0.75),inset_-1px_0_0_rgba(255,255,255,0.75)] sm:w-[min(1160px,calc(100%-40px))] sm:px-8 sm:pt-36">
      <section className="grid gap-8 pb-8 sm:pb-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div className="border-l-2 border-[#f3b51b] pl-4 sm:pl-6">
          <p className="mb-4 text-sm font-black text-emerald-800">
            {wallEyebrow}
          </p>
          <h1 className="max-w-4xl text-[clamp(48px,9vw,96px)] font-black leading-[0.9] tracking-normal text-neutral-950">
            <span className="block">{t("dailyWall")}</span>
            <span className="mt-5 block max-w-2xl text-xl leading-relaxed text-neutral-600 sm:text-2xl">
              {t("dailyTagline")}
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-700 sm:text-xl">
            {t("heroBody")}
          </p>
        </div>

        <div className="border border-stone-300 bg-white p-4 text-neutral-950 shadow-[8px_8px_0_rgba(26,26,26,0.88)] sm:p-5">
          <div className="border-l border-neutral-950 pl-4">
            <p className="text-sm font-black uppercase text-emerald-800">
              {t("learningWall")}
            </p>
            <p className="mt-3 text-lg font-black leading-relaxed text-neutral-800">
              {t("progressWallCardBody")}
            </p>
          </div>
          <div className="mt-6 grid grid-cols-3 border border-stone-200 bg-[#fffaf0]">
            <div className="border-r border-stone-200 p-3">
              <p className="text-xs font-black uppercase text-neutral-500">
                {t("cards")}
              </p>
              <p className="mt-1 text-3xl font-black">{cards.length}</p>
            </div>
            <div className="border-r border-stone-200 p-3">
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
          <div className="mt-5 border-t border-stone-200 pt-4">
            <p className="text-sm font-bold leading-relaxed text-neutral-500">
              {t("learningWallBody")}
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <ErrorState
          message={message}
          onRetry={() => {
            if (isMyLearning) {
              if (user) loadCards(user.id, { force: true });
              return;
            }

            loadCards(undefined, { force: true });
          }}
        />
      ) : null}

      {user ? (
        <section className="mb-8 border border-stone-300 bg-[#fffdf8] p-4 shadow-[6px_6px_0_rgba(26,26,26,0.88)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-neutral-950">{t("addCard")}</p>
              <p className="text-sm text-neutral-600">{t("addCardBody")}</p>
            </div>
            <Button onClick={toggleForm}>
              {showForm ? t("close") : t("newCard")}
            </Button>
          </div>
          {showForm ? (
            <LearningCardForm
              initialValue={emptyCard}
              submitLabel={t("create")}
              uploadFolder={cloudinaryLearningFolder(
                currentProfile?.username ?? user.email?.split("@")[0] ?? "user",
                draftUploadId,
              )}
              categories={categories}
              pendingLabel={t("creatingDoNotLeave")}
              onSubmit={createCard}
            />
          ) : null}
        </section>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-stone-300 pb-3">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-neutral-950">
            {selectedSubField ?? selectedCategory ?? t("learningWall")}
          </h2>
          <p className="text-sm text-neutral-600">
            {selectedCategory
              ? `${visibleCards.length} learning card${visibleCards.length === 1 ? "" : "s"}`
              : t("learningWallBody")}
          </p>
        </div>
        {selectedCategory ? (
          <Button
            variant="secondary"
            onClick={() => {
              if (selectedSubField) {
                setSelectedSubField(null);
                return;
              }

              setSelectedCategory(null);
            }}
          >
            {selectedSubField ? selectedCategory : "All categories"}
          </Button>
        ) : null}
      </div>

      {loading ? <LoadingGrid /> : null}
      {!loading && cards.length > 0 && !selectedCategory ? (
        <CategoryPlaylistGrid
          playlists={categoryPlaylists}
          onSelect={(category) => {
            setSelectedCategory(category);
            setSelectedSubField(null);
          }}
        />
      ) : null}
      {!loading && selectedCategory && !selectedSubField ? (
        <CategoryPlaylistGrid
          playlists={subFieldPlaylists}
          onSelect={setSelectedSubField}
        />
      ) : null}
      {!loading && selectedCategory && selectedSubField ? (
        <LearningCardGrid cards={visibleCards} profiles={profiles} />
      ) : null}
      {!loading && cards.length === 0 && !message ? (
        <EmptyState canCreate={Boolean(user)} />
      ) : null}
    </main>
  );
}
