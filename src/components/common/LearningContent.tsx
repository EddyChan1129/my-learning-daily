"use client";

import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { Button } from "@/components/ui/button";
import { sanitizeContent } from "@/utils/content";

let highlighterReady = false;

function registerHighlighter() {
  if (highlighterReady) return;

  hljs.registerLanguage("bash", bash);
  hljs.registerLanguage("css", css);
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("json", json);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("xml", xml);
  hljs.registerAliases(["js", "jsx"], { languageName: "javascript" });
  hljs.registerAliases(["ts", "tsx"], { languageName: "typescript" });
  highlighterReady = true;
}

type Props = {
  html: string;
  className?: string;
};

export function LearningContent({ html, className = "" }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState("");
  const sanitizedHtml = useMemo(() => sanitizeContent(html), [html]);

  useEffect(() => {
    registerHighlighter();
    contentRef.current?.querySelectorAll("pre").forEach((pre) => {
      const code = pre.querySelector("code");
      if (code) {
        const codeBlock = code as HTMLElement;
        if (!codeBlock.dataset.highlighted) hljs.highlightElement(codeBlock);
      }

      if (!pre.querySelector("[data-copy-code]")) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "code-copy-button";
        button.dataset.copyCode = "true";
        button.textContent = "Copy";
        pre.append(button);
      }
    });
  }, [sanitizedHtml]);

  useEffect(() => {
    if (!previewImage) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewImage("");
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewImage]);

  async function handleContentClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    const element = target instanceof Element ? target : null;
    const copyButton = element?.closest<HTMLButtonElement>("[data-copy-code]");

    if (copyButton) {
      const code =
        copyButton.closest("pre")?.querySelector("code")?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(code);
        copyButton.textContent = "Copied";
      } catch {
        copyButton.textContent = "Failed";
      }
      window.setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1200);
      return;
    }

    if (!(target instanceof HTMLImageElement)) return;
    if (!target.classList.contains("content-image")) return;

    setPreviewImage(target.currentSrc || target.src);
  }

  return (
    <>
      <div
        ref={contentRef}
        className={`learning-content ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        onClick={handleContentClick}
      />
      {previewImage ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreviewImage("")}
        >
          <Button
            className="absolute right-4 top-4"
            type="button"
            variant="secondary"
            onClick={() => setPreviewImage("")}
          >
            Close
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="max-h-[calc(100vh-96px)] max-w-[min(100%,1200px)] rounded-lg bg-white object-contain"
            src={previewImage}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
