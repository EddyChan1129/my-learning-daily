"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getCurrentUser,
  setCurrentUserCache,
} from "@/features/auth/services/auth.service";
import {
  getProfile,
  setProfileCache,
} from "@/features/profile/services/profile.service";
import { getSupabase } from "@/lib/supabase";
import type { Profile } from "@/types/learning";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();

export function AuthButton() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  async function loadProfile(currentUser: User) {
    if (!supabase) return;

    const nextProfile = await getProfile(supabase, currentUser);

    if (!nextProfile) return;
    setProfile(nextProfile);
    setUsername(nextProfile.username);
    setDescription(nextProfile.description ?? "");
    setPhotoUrl(nextProfile.photo_url ?? "");
  }

  useEffect(() => {
    if (!supabase) return;

    getCurrentUser(supabase).then((currentUser) => {
      setUser(currentUser);
      if (currentUser) loadProfile(currentUser);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;

      setCurrentUserCache(session?.user ?? null);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user);
      if (!session?.user) setProfile(null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function saveProfile() {
    if (!supabase || !user) return;

    const nextProfile = {
      id: user.id,
      username: username.trim() || user.email?.split("@")[0] || "User",
      description: description.trim() || null,
      photo_url: photoUrl.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data } = await supabase
      .from("profiles")
      .upsert(nextProfile)
      .select()
      .single();

    if (data) {
      setProfile(data);
      setProfileCache(data);
    }
    setEditing(false);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setEditing(false);
  }

  const displayName = profile?.username ?? user?.email ?? "";
  const avatarText = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="fixed right-3 top-3 z-10 grid justify-items-end gap-2 sm:right-4 sm:top-4">
      <div className="flex max-w-[calc(100vw-128px)] items-center gap-2 rounded-full border border-stone-200 bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(26,26,26,0.08)] backdrop-blur sm:max-w-[calc(100vw-220px)]">
        {user ? (
          <>
            <button
              className="flex min-w-0 items-center gap-2 rounded-full px-2 py-1 text-left hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
              type="button"
              onClick={() => setEditing(!editing)}
            >
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-900 text-sm font-black text-white">
                {profile?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="h-full w-full object-cover"
                    src={profile.photo_url}
                    alt=""
                  />
                ) : (
                  avatarText
                )}
              </span>
              <span className="hidden max-w-36 truncate text-sm font-black text-neutral-700 sm:block">
                {displayName}
              </span>
            </button>
            <Button
              className="min-h-9 px-3"
              variant="secondary"
              onClick={signOut}
            >
              {t("logout")}
            </Button>
          </>
        ) : (
          <Link
            className={buttonVariants({
              className: "min-h-9 px-4",
              variant: "default",
            })}
            href="/login"
          >
            {t("login")}
          </Link>
        )}
      </div>

      {editing && user ? (
        <div className="w-[min(360px,calc(100vw-24px))] border border-neutral-950 bg-white p-4 shadow-[6px_6px_0_#1a1a1a]">
          <p className="mb-3 text-lg font-black text-neutral-950">
            {t("editProfile")}
          </p>
          <div className="grid gap-2">
            <Input
              value={username}
              placeholder={t("username")}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Input
              value={photoUrl}
              placeholder={t("photoUrl")}
              onChange={(event) => setPhotoUrl(event.target.value)}
            />
            <Textarea
              className="min-h-20"
              value={description}
              placeholder={t("description")}
              onChange={(event) => setDescription(event.target.value)}
            />
            <Button onClick={saveProfile}>{t("save")}</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
