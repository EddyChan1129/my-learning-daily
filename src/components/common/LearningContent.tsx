"use client";

import { useEffect, useMemo, useRef } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
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

  return (
    <div
      ref={contentRef}
      className={`learning-content ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
