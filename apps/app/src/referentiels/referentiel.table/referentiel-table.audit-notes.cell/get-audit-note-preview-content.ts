import DOMPurify from 'dompurify';

function blockTagsToLineBreaks(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n');
}

function stripHtmlTags(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

function collapseWhitespace(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

export function getAuditNotePreviewContent(
  avis: string | null | undefined
): string {
  if (!avis) {
    return '';
  }

  const lines = stripHtmlTags(blockTagsToLineBreaks(avis)).split('\n');
  const firstLineWithContent = lines
    .map(collapseWhitespace)
    .find((line) => line.length > 0);

  return firstLineWithContent ?? '';
}
