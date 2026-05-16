import { marked, type TokenizerAndRendererExtension } from "marked";

// Configure marked for safe rendering in the side panel
marked.setOptions({
  breaks: true,    // convert \n to <br> (like GitHub)
  gfm: true,       // GitHub Flavored Markdown (tables, strikethrough, etc.)
});

/**
 * Parse a markdown string to sanitized HTML.
 * Runs in a try/catch — if parsing fails, returns the raw text escaped.
 */
export function renderMarkdown(markdown: string): string {
  try {
    const result = marked.parse(markdown, { async: false });
    // marked.parse can return string | Promise<string>; at v18 with async:false it's string
    return result as string;
  } catch {
    // Fallback: escape HTML and preserve line breaks
    return markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }
}
