'use client';

import DOMPurify from 'dompurify';

/**
 * Strict allowlist for highlight rendering.
 *
 * Meilisearch's `_formatted` payload wraps matched terms in `<mark>...</mark>`.
 * The source data (fiche titres, descriptions, filenames, etc.) is
 * user-controlled and may contain crafted HTML — DOMPurify strips everything
 * except `<mark>` and drops every attribute. No exceptions.
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['mark'],
  ALLOWED_ATTR: [] as string[],
};

export function sanitizeHighlightHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

export type HighlightedTextProps = {
  /** Raw `_formatted` HTML from Meilisearch — sanitized before render. */
  html: string;
  /**
   * The element to render. Defaults to a `span`. Use a `p` for snippets so the
   * default block-level styling kicks in.
   */
  as?: 'span' | 'p' | 'div';
  className?: string;
};

/**
 * Renders highlight markup safely. Always sanitizes via DOMPurify with the
 * `<mark>`-only allowlist, then injects via `dangerouslySetInnerHTML`.
 *
 * The shared `[&_mark]:` Tailwind utilities make every highlighted token use
 * the same yellow tint across all rows.
 */
export function HighlightedText({
  html,
  as: Component = 'span',
  className,
}: HighlightedTextProps) {
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeHighlightHtml(html) }}
    />
  );
}
