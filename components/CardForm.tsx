"use client";

import { FormEvent, useState } from "react";
import { ContentEditor } from "@/components/ContentEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LearningCardInput } from "@/types/learning";
import { uploadLearningImage } from "@/utils/cloudinary";
import { validateCard } from "@/utils/learning";

type Props = {
  initialValue: LearningCardInput;
  submitLabel: string;
  onSubmit: (value: LearningCardInput) => Promise<void>;
  onCancel?: () => void;
};

export function CardForm({
  initialValue,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [imageFile, setImageFile] = useState<File | null>(null);
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
      const imageUrl = imageFile
        ? await uploadLearningImage(imageFile)
        : value.image_url;

      await onSubmit({
        ...value,
        image_url: imageUrl,
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
    <Card className="mt-4 p-4">
      <form className="grid gap-4" onSubmit={handleSubmit}>
      {error ? <p className="font-bold text-red-700">{error}</p> : null}
      <Label>
        Title
        <Input
          value={value.title}
          onChange={(event) => setValue({ ...value, title: event.target.value })}
          required
        />
      </Label>
      <Label>
        Category
        <Select
          value={value.category}
          onChange={(event) =>
            setValue({ ...value, category: event.target.value })
          }
          required
        >
          <option value="">Select category</option>
          <option value="IT">IT</option>
          <option value="psycology">psycology</option>
          <option value="others">others</option>
        </Select>
      </Label>
      <Label>
        Date learned
        <Input
          type="date"
          value={value.learned_date}
          onChange={(event) =>
            setValue({ ...value, learned_date: event.target.value })
          }
          required
        />
      </Label>
      <Label>
        Image
        <Input
          accept="image/*"
          type="file"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
        />
        <span className="text-xs font-normal text-neutral-500">
          Uploads to Cloudinary folder /eddy-learning.
        </span>
      </Label>
      {value.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="h-40 w-full rounded-lg object-cover"
          src={value.image_url}
        />
      ) : null}
      <Label>
        Summary
        <Textarea
          rows={3}
          value={value.summary}
          onChange={(event) =>
            setValue({ ...value, summary: event.target.value })
          }
          required
        />
      </Label>
      <Label>
        Content
        <ContentEditor
          value={value.content}
          onChange={(content) => setValue({ ...value, content })}
        />
      </Label>
      <div className="flex flex-wrap justify-end gap-2.5">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button disabled={saving} type="submit">
          {saving ? "Saving..." : submitLabel}
        </Button>
      </div>
      </form>
    </Card>
  );
}
