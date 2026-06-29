export function sanitizeContent(html: string) {
  if (typeof window === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");
  const allowedTags = new Set(["B", "BR", "DIV", "IMG", "P", "SPAN", "STRONG"]);

  doc.body.querySelectorAll("*").forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }

    Array.from(node.attributes).forEach((attr) => {
      if (
        node.tagName === "IMG" &&
        ["alt", "class", "src"].includes(attr.name)
      ) {
        return;
      }

      if (attr.name === "class" && attr.value === "text-large") return;

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
  return /<img\b/i.test(html);
}

export function contentSummary(html: string) {
  const text = contentText(html).replace(/\s+/g, " ").trim();
  return text.slice(0, 140) || "Image learning note";
}
