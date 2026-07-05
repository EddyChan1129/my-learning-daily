"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  CLOUDINARY_EMOJIS,
  cloudinaryEmojiUrl,
  uploadLearningImage,
} from "@/utils/cloudinary";
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
  const [notice, setNotice] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value;
      prepareContentImages();
    }
  }, [value]);

  function prepareContentImages() {
    editorRef.current
      ?.querySelectorAll<HTMLImageElement>("img.content-image")
      .forEach((image) => {
        image.contentEditable = "false";
        image.draggable = false;
        image.tabIndex = 0;
      });
  }

  function syncValue() {
    if (selectedImage && !selectedImage.isConnected) setSelectedImage(null);
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

  function insertEmoji(publicId: string, label: string) {
    const imageUrl = cloudinaryEmojiUrl(publicId);
    if (!imageUrl) return;

    editorRef.current?.focus();
    insertHtml(
      `<img class="emoji-image" src="${imageUrl}" alt="${label}" />&nbsp;`,
    );
    syncValue();
  }

  function nodeContentImage(node: Node | null) {
    if (!node) return null;
    if (
      node instanceof HTMLImageElement &&
      node.classList.contains("content-image")
    ) {
      return node;
    }

    return node instanceof Element
      ? node.querySelector<HTMLImageElement>("img.content-image")
      : null;
  }

  function nearbyNode(node: Node, direction: "backward" | "forward") {
    let current: Node | null = node;

    while (current && current !== editorRef.current) {
      const sibling =
        direction === "backward"
          ? current.previousSibling
          : current.nextSibling;

      if (sibling) {
        current = sibling;
        while (
          direction === "backward" ? current.lastChild : current.firstChild
        ) {
          current =
            direction === "backward" ? current.lastChild! : current.firstChild!;
        }
        return current;
      }

      current = current.parentNode;
    }

    return null;
  }

  function imageForDelete(direction: "backward" | "forward") {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return null;

    const range = selection.getRangeAt(0);
    for (const image of editor.querySelectorAll<HTMLImageElement>("img.content-image")) {
      if (range.intersectsNode(image)) return image;
    }

    if (!range.collapsed) return null;

    if (range.startContainer instanceof Element) {
      const adjacent =
        range.startContainer.childNodes[
          direction === "backward" ? range.startOffset - 1 : range.startOffset
        ];
      return nodeContentImage(adjacent);
    }

    const text = range.startContainer.textContent ?? "";
    if (
      (direction === "backward" && range.startOffset === 0) ||
      (direction === "forward" && range.startOffset === text.length)
    ) {
      return nodeContentImage(nearbyNode(range.startContainer, direction));
    }

    return null;
  }

  function preventImageDelete(direction: "backward" | "forward") {
    const image = imageForDelete(direction);
    if (!image) return false;

    setSelectedImage(image);
    setNotice("Use Remove image to delete this image. Save after removing it.");
    return true;
  }

  function selectionInCodeBlock() {
    const node = window.getSelection()?.anchorNode;
    const element = node instanceof Element ? node : node?.parentElement;

    return Boolean(element?.closest("pre, code"));
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab" && selectionInCodeBlock()) {
      event.preventDefault();
      document.execCommand("insertText", false, "    ");
      syncValue();
      return;
    }

    if (event.key !== "Backspace" && event.key !== "Delete") return;

    const direction = event.key === "Backspace" ? "backward" : "forward";
    if (!preventImageDelete(direction)) return;

    event.preventDefault();
  }

  function handleBeforeInput(event: FormEvent<HTMLDivElement>) {
    const inputEvent = event.nativeEvent as InputEvent;
    if (!inputEvent.inputType?.startsWith("delete")) return;

    const direction =
      inputEvent.inputType === "deleteContentForward" ? "forward" : "backward";
    if (!preventImageDelete(direction)) return;

    event.preventDefault();
  }

  function selectImage(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;

    if (
      target instanceof HTMLImageElement &&
      target.classList.contains("content-image")
    ) {
      setSelectedImage(target);
      return;
    }

    setSelectedImage(null);
  }

  function removeSelectedImage() {
    if (!selectedImage?.isConnected) {
      setSelectedImage(null);
      return;
    }

    const wrapper = selectedImage.closest("p");
    if (wrapper?.querySelectorAll("img, video, iframe").length === 1) {
      wrapper.remove();
    } else {
      selectedImage.remove();
    }

    setSelectedImage(null);
    setNotice("Image removed. Save to delete it from Cloudinary, then upload again if needed.");
    syncValue();
  }

  async function insertImage(file: File) {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      setNotice("");
      const imageUrl = await uploadLearningImage(file, uploadFolder);
      insertHtml(
        `<p><img class="content-image" src="${imageUrl}" alt="" /></p><p><br></p>`,
      );
      prepareContentImages();
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
            aria-expanded={showEmojis}
            aria-label={t("emoji")}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setShowEmojis((currentValue) => !currentValue)}
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
            onChange={uploadImage}
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
                onClick={() => insertEmoji(emoji.publicId, emoji.label)}
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
        {selectedImage ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
            <span>Image selected. Remove it here, then upload again if needed.</span>
            <Button
              type="button"
              variant="destructive"
              onMouseDown={(event) => event.preventDefault()}
              onClick={removeSelectedImage}
            >
              Remove image
            </Button>
          </div>
        ) : null}
        <div
          ref={editorRef}
          className="learning-content min-h-72 cursor-text px-4 py-4 text-base text-neutral-950 outline-none [&_.text-large]:text-2xl"
          contentEditable
          tabIndex={0}
          onBlur={syncValue}
          onBeforeInput={handleBeforeInput}
          onInput={syncValue}
          onClick={selectImage}
          onKeyDown={handleEditorKeyDown}
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
      {notice ? <p className="text-xs font-bold text-amber-700">{notice}</p> : null}
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
