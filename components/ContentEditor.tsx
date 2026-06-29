"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ContentEditor({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(open: string, close: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const nextValue = `${value.slice(0, start)}${open}${selected}${close}${value.slice(end)}`;

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + open.length, end + open.length);
    });
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => wrapSelection("<strong>", "</strong>")}
        >
          Bold
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => wrapSelection('<strong class="text-large">', "</strong>")}
        >
          Large
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        className="min-h-56"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  );
}
