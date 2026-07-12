"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSelect } from "@/components/layout/LanguageSelect";
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
import { uploadCloudinaryImage } from "@/utils/cloudinary";
import { cn } from "@/utils/cn";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();
const profileImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function AuthButton({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadProfile(currentUser: User) {
    if (!supabase) return;

    const nextProfile = await getProfile(supabase, currentUser);

    if (!nextProfile) return;
    setProfile(nextProfile);
    setUsername(nextProfile.username);
    setDescription(nextProfile.description ?? "");
    setPhotoUrl(nextProfile.photo_url ?? "");
    setPhotoPreviewUrl(nextProfile.photo_url ?? "");
    setPhotoFile(null);
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

  useEffect(
    () => () => {
      if (photoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    },
    [photoPreviewUrl],
  );

  function selectProfileImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!profileImageTypes.has(file.type) || file.size > 5 * 1024 * 1024) {
      setProfileMessage(t("profileImageInvalid"));
      return;
    }

    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setProfileMessage("");
  }

  async function saveProfile() {
    if (!supabase || !user) return;

    setSaving(true);
    setProfileMessage("");

    try {
      const nextPhotoUrl = photoFile
        ? await uploadCloudinaryImage(photoFile, "user-profile")
        : photoUrl.trim() || null;
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: username.trim() || user.email?.split("@")[0] || "User",
          description: description.trim() || null,
          photo_url: nextPhotoUrl,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single<Profile>();

      if (error) throw error;

      setProfile(data);
      setProfileCache(data);
      setPhotoUrl(data.photo_url ?? "");
      setPhotoPreviewUrl(data.photo_url ?? "");
      setPhotoFile(null);
      setEditing(false);
    } catch (error) {
      setProfileMessage(
        error instanceof Error ? error.message : t("profileSaveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setEditing(false);
    onNavigate?.();
  }

  const displayName = profile?.username ?? user?.email ?? "";
  const avatarText = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="relative grid w-full gap-2 sm:w-auto">
      <div
        className={cn(
          "flex w-full items-center gap-2 sm:w-auto",
          user &&
            "rounded-xl border border-stone-200 bg-stone-50 p-1 sm:rounded-full",
        )}
      >
        {user ? (
          <>
            <button
              className="flex min-w-0 items-center gap-2 rounded-full px-2 py-1 text-left hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
              type="button"
              onClick={() => setEditing(!editing)}
            >
              <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-900 text-xs font-black text-white sm:size-9 sm:text-sm">
                {profile?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="h-full w-full object-cover"
                    src={profile.photo_url}
                    alt={displayName}
                  />
                ) : (
                  avatarText
                )}
              </span>
              <span className="block max-w-36 truncate text-sm font-black text-neutral-700">
                {displayName}
              </span>
            </button>
            <Button
              className="min-h-8 px-2.5 text-xs sm:hidden"
              variant="secondary"
              onClick={signOut}
            >
              {t("logout")}
            </Button>
          </>
        ) : (
          <>
            <div className="hidden w-32 sm:block">
              <LanguageSelect />
            </div>
            <Link
              className={buttonVariants({
                className: "min-h-10 w-full px-4 sm:min-h-9 sm:w-auto",
                variant: "default",
              })}
              href="/login"
              onClick={onNavigate}
            >
              {t("login")}
            </Link>
          </>
        )}
      </div>

      {editing && user ? (
        <div className="w-[min(360px,calc(100vw-24px))] border border-neutral-950 bg-white p-4 shadow-[6px_6px_0_#1a1a1a] sm:absolute sm:right-0 sm:top-[calc(100%+0.75rem)] sm:z-50">
          <div className="mb-3 hidden sm:block">
            <LanguageSelect />
          </div>
          <p className="mb-3 text-lg font-black text-neutral-950">
            {t("editProfile")}
          </p>
          <div className="grid gap-2">
            <Input
              value={username}
              placeholder={t("username")}
              onChange={(event) => setUsername(event.target.value)}
            />
            <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-[#fffaf0] p-3">
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-900 text-lg font-black text-white">
                {photoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="h-full w-full object-cover"
                    src={photoPreviewUrl}
                    alt={displayName}
                  />
                ) : (
                  avatarText
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-black text-neutral-950">
                  {t("profileImage")}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {t("profileImageHint")}
                </p>
                <label
                  className={buttonVariants({
                    className:
                      "mt-2 min-h-9 max-w-full cursor-pointer px-3 py-1 text-xs",
                    variant: "secondary",
                  })}
                >
                  <span className="truncate">
                    {photoFile?.name ?? t("uploadImage")}
                  </span>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    type="file"
                    onChange={selectProfileImage}
                  />
                </label>
              </div>
            </div>
            <Textarea
              className="min-h-20"
              value={description}
              placeholder={t("description")}
              onChange={(event) => setDescription(event.target.value)}
            />
            {profileMessage ? (
              <p className="text-sm font-bold text-red-700" role="alert">
                {profileMessage}
              </p>
            ) : null}
            <Button disabled={saving} onClick={saveProfile}>
              {saving ? t("saving") : t("save")}
            </Button>
            <Button className="hidden sm:inline-flex" variant="secondary" onClick={signOut}>
              {t("logout")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
