import sanitizeHtml from "sanitize-html";

/** Wix catalog HTML is content, never executable markup. */
export function safeCatalogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags,
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "title", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (_name, attrs) => ({ tagName: "a", attribs: { ...attrs, rel: "noopener noreferrer" } }),
    },
  });
}
