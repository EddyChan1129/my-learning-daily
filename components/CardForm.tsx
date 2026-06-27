"use client";

import { FormEvent, useState } from "react";
import { LearningCardInput, validateCard } from "@/lib/learningCards";

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
        image_url: value.image_url?.trim() || null,
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
    <form className="form" onSubmit={handleSubmit}>
      {error ? <p className="formError">{error}</p> : null}
      <label>
        Title
        <input
          value={value.title}
          onChange={(event) => setValue({ ...value, title: event.target.value })}
          required
        />
      </label>
      <label>
        Category
        <input
          value={value.category}
          onChange={(event) =>
            setValue({ ...value, category: event.target.value })
          }
          required
        />
      </label>
      <label>
        Date learned
        <input
          type="date"
          value={value.learned_date}
          onChange={(event) =>
            setValue({ ...value, learned_date: event.target.value })
          }
          required
        />
      </label>
      <label>
        Image URL
        <input
          value={value.image_url ?? ""}
          onChange={(event) =>
            setValue({ ...value, image_url: event.target.value })
          }
        />
      </label>
      <label>
        Summary
        <textarea
          rows={3}
          value={value.summary}
          onChange={(event) =>
            setValue({ ...value, summary: event.target.value })
          }
          required
        />
      </label>
      <label>
        Content
        <textarea
          rows={8}
          value={value.content}
          onChange={(event) =>
            setValue({ ...value, content: event.target.value })
          }
          required
        />
      </label>
      <div className="formActions">
        {onCancel ? (
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button className="button" disabled={saving} type="submit">
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
