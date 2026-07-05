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
    contentRef.current
      ?.querySelectorAll("pre code")
      .forEach((block) => {
        const codeBlock = block as HTMLElement;
        if (!codeBlock.dataset.highlighted) hljs.highlightElement(codeBlock);
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

  function openImagePreview(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
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
        onClick={openImagePreview}
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
