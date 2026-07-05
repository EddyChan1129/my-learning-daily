const CLOUDINARY_EMOJI_PATTERN = /\/image\/upload\/(?:v\d+\/)?(smile|sad|omg|think)(?:\.[a-z]+)?(?:[?#].*)?$/i;

export function sanitizeContent(html: string) {
  if (typeof window === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const allowedTags = new Set([
    "B",
    "BR",
    "CODE",
    "DIV",
    "IMG",
    "P",
    "PRE",
    "SPAN",
    "STRONG",
  ]);

  doc.body.querySelectorAll("*").forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }

    Array.from(node.attributes).forEach((attr) => {
      if (node.tagName === "IMG" && attr.name === "src") {
        if (CLOUDINARY_EMOJI_PATTERN.test(attr.value)) {
          node.setAttribute("class", "emoji-image");
        }
        return;
      }

      if (node.tagName === "IMG" && ["alt", "class"].includes(attr.name)) {
        return;
      }

      if (attr.name === "class") {
        const allowedClasses =
          node.tagName === "CODE"
            ? attr.value
                .split(/\s+/)
                .filter((className) => /^language-[\w-]+$/.test(className))
            : attr.value.split(/\s+/).filter((className) => className === "text-large");

        if (allowedClasses.length) {
          node.setAttribute("class", allowedClasses.join(" "));
          return;
        }
      }

      node.removeAttribute(attr.name);
    });
  });

  return doc.body.innerHTML;
}

export function contentText(html: string) {
  if (typeof window === "undefined") return html;

  return new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
}

export function contentHasImage(html: string) {
  return Boolean(firstContentImageUrl(html));
}

export function firstContentImageUrl(html: string) {
  if (typeof window === "undefined") return null;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const image = doc.body.querySelector<HTMLImageElement>("img.content-image");

  return image?.getAttribute("src") ?? null;
}

export function contentSummary(html: string) {
  const text = contentText(html).replace(/\s+/g, " ").trim();
  return text.slice(0, 140) || "Image learning note";
}
