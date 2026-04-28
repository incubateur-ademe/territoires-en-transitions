/**
 * DOMPurify configuration shared by the server-side sanitization (banner
 * upsert, jsdom-backed) and the client-side defense-in-depth pass at render
 * time. Single source of truth: keep a single `SAFE_HTML_CONFIG` so the two
 * passes cannot drift.
 */
export const SAFE_HTML_CONFIG = {
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'],
  FORBID_ATTR: [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
  ],
  // BlockNote emits `<a target="_blank" rel="...">` for external links;
  // DOMPurify defaults strip both. Re-allow them so the rel-injection hook
  // (`installSafeLinksHook`) has something to act on.
  ADD_ATTR: ['target', 'rel'],
};

/**
 * Minimal duck-typed shape we rely on for installing hooks. Both
 * `dompurify` (browser) and `createDOMPurify(jsdom.window)` (server) expose
 * `addHook` with this signature, so the helper works on either side without
 * dragging the DOMPurify type into the domain package.
 */
type PurifyLike = {
  addHook: (
    event: 'uponSanitizeAttribute',
    handler: (
      node: { setAttribute: (name: string, value: string) => void },
      data: { attrName: string; attrValue: string }
    ) => void
  ) => void;
};

/**
 * Installs a `uponSanitizeAttribute` hook that injects
 * `rel="noopener noreferrer"` whenever an anchor is sanitized with
 * `target="_blank"`. Without this, BlockNote-emitted external links would
 * give the destination page access to `window.opener` (reverse-tabnabbing).
 *
 * Idempotent enough in practice: each consumer calls it exactly once at
 * module load against its own DOMPurify instance.
 */
export function installSafeLinksHook(purify: PurifyLike): void {
  purify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'target' && data.attrValue === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}
