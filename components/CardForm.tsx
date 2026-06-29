"use client";

import { FormEvent, useState } from "react";
import { ContentEditor } from "@/components/ContentEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { LearningCardInput } from "@/types/learning";
import { contentSummary } from "@/utils/content";
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
        Content
        <ContentEditor
          value={value.content}
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
