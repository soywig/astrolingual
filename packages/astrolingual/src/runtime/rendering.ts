import { HTMLString, markHTMLString } from "astro/runtime/server/index.js";

const SLOT = /\uE000(\d+)\uE001/g; // private-use characters
const MARKDOWN_ESCAPE_CODES: Record<string, string> = {
  "*": "\uE002",
  _: "\uE003",
  "[": "\uE004",
  "]": "\uE005",
  "(": "\uE006",
  ")": "\uE007",
};

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape HTML special characters in a string to prevent XSS attacks.
 * @param rawInput - The input string to escape.
 * @returns The escaped string with HTML special characters replaced by their corresponding HTML entities.
 */
export function escapeHtml(rawInput: string): string {
  return rawInput.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

/**
 * Restore escaped markdown characters in a string to their original form.
 * @param escapedMarkdown The input string with escaped markdown characters.
 * @returns The string with escaped markdown characters restored to their original form.
 */
function restoreEscapedMarkdown(escapedMarkdown: string): string {
  return escapedMarkdown.replace(
    /[\uE002-\uE007]/g,
    (character) =>
      Object.keys(MARKDOWN_ESCAPE_CODES).find(
        (key) => MARKDOWN_ESCAPE_CODES[key] === character,
      ) ?? character,
  );
}

// plain string = escape, HTMLString (from another t() call) = trust
function escapeArg(v: unknown): string {
  return v instanceof HTMLString ? String(v) : escapeHtml(String(v ?? ""));
}

// only allow safe schemes (blocks javascript:) and relative URLs; protect * and _ from markdown
function safeUrl(url: string): string {
  const trimmed = url.trim();
  const hasUnsupportedScheme =
    /^[a-z][a-z\d+.-]*:/i.test(trimmed) &&
    !/^(https?:\/\/|mailto:|tel:)/i.test(trimmed);

  if (!trimmed || trimmed.startsWith("//") || hasUnsupportedScheme) return "#";

  return escapeHtml(trimmed).replace(/\*/g, "&#42;").replace(/_/g, "&#95;");
}

export function render(template: string, args: unknown[] = []): HTMLString {
  const html = template
    // 1. newlines -> <br> (before anything else)
    .replace(/\r?\n/g, "<br>")
    // 2. "$$" and "$ " -> literal $, "$n" -> placeholder
    .replace(/\$\$|\$ |\$([0-9]+)/g, (_m, i) =>
      i === undefined ? "$" : `\uE000${i}\uE001`,
    )
    .replace(
      /\\([*_\[\]()])/g,
      (_m, character) => MARKDOWN_ESCAPE_CODES[character],
    )
    // 3. links first (url gets the real arg value, then sanitized)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => {
      const raw = url.replace(SLOT, (_: string, i: string) =>
        String(args[Number(i)] ?? ""),
      );
      const target = /^https?:\/\//i.test(raw.trim()) ? ' target="_blank"' : "";
      return `<a href="${safeUrl(raw)}"${target}>${label}</a>`;
    })
    // 4. strong / em
    .replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>")
    .replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)/g, "<em>$1</em>")
    // 5. fill the remaining slots LAST, escaped
    .replace(SLOT, (_m, i) => escapeArg(args[Number(i)]));

  return markHTMLString(restoreEscapedMarkdown(html));
}
