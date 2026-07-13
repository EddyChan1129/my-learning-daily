"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { ContentEditorToolbar } from "@/features/learning/components/ContentEditorToolbar";
import { getSupabase } from "@/lib/supabase";
import {
  cloudinaryPublicIdFromUrl,
  deleteCloudinaryAssets,
  uploadCloudinaryImage,
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

  const prepareContentImages = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.querySelectorAll<HTMLImageElement>("img.content-image").forEach((image) => {
      image.contentEditable = "false";
      image.draggable = false;
      image.tabIndex = 0;

      let frame = image.closest<HTMLElement>("[data-content-image-frame]");
      if (!frame) {
        frame = document.createElement("span");
        frame.dataset.contentImageFrame = "true";
        frame.contentEditable = "false";
        image.parentNode?.insertBefore(frame, image);
        frame.append(image);
      }

      if (frame.querySelector("[data-remove-content-image]")) return;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "content-image-remove";
      removeButton.dataset.removeContentImage = "true";
      removeButton.setAttribute("aria-label", t("removeImage"));
      removeButton.textContent = "-";
      frame.append(removeButton);
    });
  }, [t]);

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value;
      prepareContentImages();
    }
  }, [prepareContentImages, value]);

  function cleanEditorHtml() {
    const clone = editorRef.current?.cloneNode(true) as HTMLDivElement | null;
    if (!clone) return "";

    clone.querySelectorAll("[data-remove-content-image]").forEach((button) => {
      button.remove();
    });
    clone.querySelectorAll("[data-content-image-frame]").forEach((frame) => {
      frame.replaceWith(...Array.from(frame.childNodes));
    });

    return sanitizeContent(clone.innerHTML);
  }

  function syncValue() {
    onChange(cleanEditorHtml());
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

  function currentEditorRange() {
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    return range && editorRef.current?.contains(range.commonAncestorContainer)
      ? range.cloneRange()
      : null;
  }

  function insertImageBlock(imageUrl: string, range: Range | null) {
    const editor = editorRef.current;
    if (!editor) return;

    const imageBlock = document.createElement("p");
    const image = document.createElement("img");
    image.className = "content-image";
    image.src = imageUrl;
    image.alt = "";
    imageBlock.append(image);

    const typingBlock = document.createElement("p");
    typingBlock.append(document.createElement("br"));

    let current = range?.startContainer ?? null;
    while (current?.parentNode && current.parentNode !== editor) {
      current = current.parentNode;
    }

    if (current?.parentNode === editor) {
      editor.insertBefore(imageBlock, current.nextSibling);
      editor.insertBefore(typingBlock, imageBlock.nextSibling);
    } else {
      editor.append(imageBlock, typingBlock);
    }

    const nextRange = document.createRange();
    nextRange.setStart(typingBlock, 0);
    nextRange.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(nextRange);
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

  function insertEmoji(imageUrl: string, label: string) {
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

  async function removeImage(image: HTMLImageElement) {
    if (image.dataset.deleting) return false;

    if (
      !window.confirm(
        t("removeImageConfirm"),
      )
    ) {
      return false;
    }

    image.dataset.deleting = "true";
    setError("");
    setNotice("");

    try {
      const publicId = cloudinaryPublicIdFromUrl(image.currentSrc || image.src);

      if (publicId) {
        const { data } = await getSupabase()?.auth.getSession() ?? { data: null };
        const accessToken = data?.session?.access_token;
        if (!accessToken) throw new Error("Please sign in before deleting images.");

        await deleteCloudinaryAssets({
          accessToken,
          folders: [],
          publicIds: [publicId],
        });
      }
    } catch (deleteError) {
      delete image.dataset.deleting;
      setError(
        deleteError instanceof Error ? deleteError.message : "Image delete failed.",
      );
      return false;
    }

    const frame = image.closest<HTMLElement>("[data-content-image-frame]");
    const block = (frame ?? image).closest("p");
    const blockClone = block?.cloneNode(true) as HTMLElement | undefined;
    blockClone?.querySelectorAll("[data-remove-content-image]").forEach((button) => {
      button.remove();
    });

    if (
      block &&
      block.querySelectorAll("img.content-image").length === 1 &&
      !blockClone?.textContent?.trim()
    ) {
      block.remove();
    } else {
      (frame ?? image).remove();
    }

    setNotice(t("imageRemovedNotice"));
    syncValue();
    return true;
  }

  function preventImageDelete(direction: "backward" | "forward") {
    const image = imageForDelete(direction);
    if (!image) return false;

    void removeImage(image);
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
    if (preventImageDelete(direction)) event.preventDefault();
  }

  function handleBeforeInput(event: FormEvent<HTMLDivElement>) {
    const inputEvent = event.nativeEvent as InputEvent;
    if (!inputEvent.inputType?.startsWith("delete")) return;

    const direction =
      inputEvent.inputType === "deleteContentForward" ? "forward" : "backward";
    if (preventImageDelete(direction)) event.preventDefault();
  }

  function handleEditorClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const removeButton = target.closest<HTMLButtonElement>(
      "[data-remove-content-image]",
    );
    if (!removeButton) return;

    const image = removeButton
      .closest("[data-content-image-frame]")
      ?.querySelector<HTMLImageElement>("img.content-image");
    if (!image) return;

    event.preventDefault();
    void removeImage(image);
  }

  function handleEditorMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (
      event.target instanceof Element &&
      event.target.closest("[data-remove-content-image]")
    ) {
      event.preventDefault();
      return;
    }
  }

  async function insertImage(file: File, range = currentEditorRange()) {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      setNotice("");
      const imageUrl = await uploadCloudinaryImage(file, uploadFolder);
      insertImageBlock(imageUrl, range);
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

    const range = currentEditorRange();
    event.preventDefault();
    await insertImage(file, range);
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
        <ContentEditorToolbar
          fileInputRef={fileInputRef}
          showEmojis={showEmojis}
          uploading={uploading}
          onBold={() => runCommand("bold")}
          onCode={insertCodeBlock}
          onEmojiSelect={insertEmoji}
          onLarge={() => runCommand("large")}
          onToggleEmojis={() =>
            setShowEmojis((currentValue) => !currentValue)
          }
          onUploadImage={uploadImage}
        />
        <div
          ref={editorRef}
          className="learning-content min-h-72 cursor-text px-4 py-4 text-base text-neutral-950 outline-none [&_.text-large]:text-2xl"
          contentEditable
          tabIndex={0}
          onBlur={syncValue}
          onBeforeInput={handleBeforeInput}
          onInput={syncValue}
          onClick={handleEditorClick}
          onKeyDown={handleEditorKeyDown}
          onMouseDown={handleEditorMouseDown}
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
