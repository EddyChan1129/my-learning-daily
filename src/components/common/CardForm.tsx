"use client";

import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { ContentEditor } from "@/components/common/ContentEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { LearningCategory } from "@/features/category/types";
import type { LearningCardInput } from "@/types/learning";
import { contentSummary } from "@/utils/content";
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
      await onSubmit({
        ...value,
        summary: contentSummary(value.content),
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
          value={value.category}
          onChange={(event) =>
            setValue({ ...value, category: event.target.value })
          }
          required
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
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
