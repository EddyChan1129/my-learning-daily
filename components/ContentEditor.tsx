"use client";

import { ClipboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadLearningImage } from "@/utils/cloudinary";
import { sanitizeContent } from "@/utils/content";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function ContentEditor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function syncValue() {
    onChange(sanitizeContent(editorRef.current?.innerHTML ?? ""));
  }

  function wrapSelection(className?: string) {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (!range || !editorRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    const span = document.createElement("strong");
    if (className) span.className = className;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection?.removeAllRanges();
    syncValue();
  }

  function insertHtml(html: string) {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (!range || !editorRef.current?.contains(range.commonAncestorContainer)) {
      editorRef.current?.insertAdjacentHTML("beforeend", html);
      return;
    }

    const template = document.createElement("template");
    template.innerHTML = html;
    range.deleteContents();
    range.insertNode(template.content);
  }

  async function pasteImage(event: ClipboardEvent<HTMLDivElement>) {
    const file = Array.from(event.clipboardData.files).find((item) =>
      item.type.startsWith("image/"),
    );

    if (!file) return;

    event.preventDefault();
    setUploading(true);
    setError("");

    try {
      const imageUrl = await uploadLearningImage(file);
      insertHtml(`<p><img class="content-image" src="${imageUrl}" alt="" /></p>`);
      syncValue();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => wrapSelection()}>
          Bold
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => wrapSelection("text-large")}
        >
          Large
        </Button>
      </div>
      <div
        ref={editorRef}
        className="min-h-56 rounded-lg border border-stone-200 bg-white px-3 py-2 text-base text-neutral-950 outline-offset-2 focus-visible:outline-2 focus-visible:outline-neutral-950 [&_.content-image]:my-4 [&_.content-image]:max-h-[420px] [&_.content-image]:w-full [&_.content-image]:rounded-lg [&_.content-image]:object-cover [&_.text-large]:text-2xl"
        contentEditable
        onBlur={syncValue}
        onInput={syncValue}
        onPaste={pasteImage}
        role="textbox"
        aria-label="Content"
        suppressContentEditableWarning
      />
      <p className="text-xs font-normal text-neutral-500">
        Paste screenshot with Control+V or Command+V.
        {uploading ? " Uploading image..." : ""}
      </p>
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
