"use client";

import { ChangeEvent, ClipboardEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { uploadLearningImage } from "@/utils/cloudinary";
import { sanitizeContent } from "@/utils/content";

type Props = {
  value: string;
  uploadFolder: string;
  onChange: (value: string) => void;
  onFirstImage: (imageUrl: string) => void;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function ContentEditor({
  value,
  uploadFolder,
  onChange,
  onFirstImage,
}: Props) {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function syncValue() {
    onChange(sanitizeContent(editorRef.current?.innerHTML ?? ""));
  }

  function runCommand(command: "bold" | "large") {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, "false");

    if (command === "bold") {
      document.execCommand("bold");
    } else {
      const selectedText = document.getSelection()?.toString();
      if (!selectedText) return;
      document.execCommand(
        "insertHTML",
        false,
        `<strong class="text-large">${selectedText}</strong>`,
      );
    }

    syncValue();
  }

  function insertHtml(html: string) {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (!range || !editorRef.current?.contains(range.commonAncestorContainer)) {
      editorRef.current?.insertAdjacentHTML("beforeend", html);
      return;
    }

    range.deleteContents();
    range.insertNode(document.createRange().createContextualFragment(html));
  }

  function insertCodeBlock() {
    editorRef.current?.focus();
    const selection = window.getSelection();
    const selectedText = selection?.toString();
    const code = selectedText || "// write code here";

    insertHtml(
      `<pre><code class="language-tsx">${escapeHtml(code)}</code></pre><p><br></p>`,
    );
    syncValue();
  }

  async function insertImage(file: File) {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const imageUrl = await uploadLearningImage(file, uploadFolder);
      insertHtml(
        `<p><img class="content-image" src="${imageUrl}" alt="" /></p><p><br></p>`,
      );
      onFirstImage(imageUrl);
      syncValue();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function pasteImage(event: ClipboardEvent<HTMLDivElement>) {
    const file = Array.from(event.clipboardData.files).find((item) =>
      item.type.startsWith("image/"),
    );

    if (!file) return;

    event.preventDefault();
    await insertImage(file);
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    await insertImage(file);
    event.target.value = "";
  }

  return (
    <div className="grid gap-2">
      <div className="overflow-hidden rounded-lg border border-stone-200 bg-white focus-within:outline-2 focus-within:outline-neutral-950">
        <div className="flex flex-wrap gap-2 border-b border-stone-200 bg-stone-50 p-2">
          <Button
            type="button"
            variant="secondary"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("bold")}
          >
            {t("bold")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("large")}
          >
            {t("large")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onMouseDown={(event) => event.preventDefault()}
            onClick={insertCodeBlock}
          >
            Code
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
            onChange={uploadImage}
          />
        </div>
        <div
          ref={editorRef}
          className="learning-content min-h-72 cursor-text px-4 py-4 text-base text-neutral-950 outline-none [&_.text-large]:text-2xl"
          contentEditable
          tabIndex={0}
          onBlur={syncValue}
          onInput={syncValue}
          onPaste={pasteImage}
          role="textbox"
          aria-label="Content"
          suppressContentEditableWarning
        />
      </div>
      <p className="text-xs font-normal text-neutral-500">
        Click the content area to type. Paste image with Command+V, or use Upload image.
        {uploading ? " Uploading image..." : ""}
      </p>
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
