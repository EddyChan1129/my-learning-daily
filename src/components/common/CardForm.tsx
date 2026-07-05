"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ContentEditor } from "@/components/common/ContentEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { categoryImageById } from "@/features/category/constants";
import type { LearningCategory } from "@/features/category/types";
import type { LearningCardInput } from "@/types/learning";
import { contentSummary, firstContentImageUrl } from "@/utils/content";
import { cloudinaryPublicIdsFromContent } from "@/utils/cloudinary";
import { validateCard } from "@/utils/learning";

type Props = {
  initialValue: LearningCardInput;
  submitLabel: string;
  uploadFolder: string;
  categories: LearningCategory[];
  onSubmit: (value: LearningCardInput) => Promise<void>;
  onCancel?: () => void;
};

export function CardForm({
  initialValue,
  submitLabel,
  uploadFolder,
  categories,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const categoryGroups = groupCategories(categories);
  const initialImagePublicIds = useMemo(
    () => cloudinaryPublicIdsFromContent(initialValue.content),
    [initialValue.content],
  );
  const currentImagePublicIds = cloudinaryPublicIdsFromContent(value.content);
  const isRemovingImage = initialImagePublicIds.some(
    (publicId) => !currentImagePublicIds.includes(publicId),
  );

  useEffect(() => {
    if (!saving && !isRemovingImage) return;

    function blockLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", blockLeave);
    return () => window.removeEventListener("beforeunload", blockLeave);
  }, [isRemovingImage, saving]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateCard(value);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const nextValue = {
        ...value,
        image_url:
          firstContentImageUrl(value.content) ??
          categoryImageById[value.sub_field] ??
          null,
        summary: contentSummary(value.content),
      };

      await onSubmit({
        ...nextValue,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Save failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="mt-4 grid gap-4 border-t border-stone-200 pt-4"
      onSubmit={handleSubmit}
    >
      {saving ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/35 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex min-w-72 items-center gap-3 rounded-lg border border-stone-200 bg-white px-5 py-4 text-sm font-black text-neutral-950 shadow-[8px_8px_0_#1a1a1a]">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-950" />
            {t("savingDoNotLeave")}
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Label>
          {t("title")}
          <Input
            value={value.title}
            onChange={(event) =>
              setValue({ ...value, title: event.target.value })
            }
            required
          />
        </Label>
        <Label>
          {t("dateLearned")}
          <Input
            type="date"
            value={value.learned_date}
            readOnly
            required
          />
        </Label>
      </div>
      <Label>
        {t("category")}
        <Select
          value={value.sub_field}
          onChange={(event) => {
            const category = categories.find(
              (item) => item.id === event.target.value,
            );

            setValue({
              ...value,
              category: category?.category ?? "",
              sub_field: category?.id ?? "",
            });
          }}
          required
        >
          <option value="">Select category</option>
          {categoryGroups.map((group) => (
            <optgroup key={group.category} label={group.category}>
              {group.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Label>
      <div className="grid gap-1.5">
        <span className="text-sm font-bold text-neutral-600">
          {t("content")}
        </span>
        <ContentEditor
          value={value.content}
          uploadFolder={uploadFolder}
          onChange={(content) =>
            setValue((currentValue) => ({ ...currentValue, content }))
          }
          onFirstImage={(imageUrl) =>
            setValue((currentValue) => ({
              ...currentValue,
              image_url: currentValue.image_url ?? imageUrl,
            }))
          }
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2.5">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </Button>
        ) : null}
        <Button disabled={saving} type="submit">
          {saving ? t("saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function groupCategories(categories: LearningCategory[]) {
  const groups = new Map<string, LearningCategory[]>();

  for (const category of categories) {
    groups.set(category.category, [
      ...(groups.get(category.category) ?? []),
      category,
    ]);
  }

  return Array.from(groups, ([category, groupedCategories]) => ({
    category,
    categories: groupedCategories,
  }));
}
