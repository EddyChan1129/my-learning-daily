"use client";

import type {
  ChangeEvent,
  RefObject,
} from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  CLOUDINARY_EMOJIS,
  cloudinaryEmojiUrl,
} from "@/utils/cloudinary";

export function ContentEditorToolbar({
  fileInputRef,
  showEmojis,
  uploading,
  onBold,
  onCode,
  onEmojiSelect,
  onLarge,
  onToggleEmojis,
  onUploadImage,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  showEmojis: boolean;
  uploading: boolean;
  onBold: () => void;
  onCode: () => void;
  onEmojiSelect: (imageUrl: string, label: string) => void;
  onLarge: () => void;
  onToggleEmojis: () => void;
  onUploadImage: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-wrap gap-2 border-b border-stone-200 bg-stone-50 p-2">
        <Button
          type="button"
          variant="secondary"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onBold}
        >
          {t("bold")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onLarge}
        >
          {t("large")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onCode}
        >
          Code
        </Button>
        <Button
          type="button"
          variant="secondary"
          aria-expanded={showEmojis}
          aria-label={t("emoji")}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onToggleEmojis}
        >
          ☺
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? t("uploading") : t("uploadImage")}
        </Button>
        <input
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          type="file"
          onChange={onUploadImage}
        />
      </div>
      {showEmojis ? (
        <div className="grid grid-cols-8 gap-1 border-b border-stone-200 bg-[#26373b] p-2 sm:grid-cols-12">
          {CLOUDINARY_EMOJIS.map((emoji) => {
            const imageUrl = cloudinaryEmojiUrl(emoji.publicId);

            return (
              <button
                key={emoji.publicId}
                type="button"
                className="flex aspect-square items-center justify-center rounded-md transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (imageUrl) onEmojiSelect(imageUrl, emoji.label);
                }}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={emoji.label}
                    className="h-8 w-8 object-contain"
                    src={imageUrl}
                  />
                ) : (
                  "?"
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
