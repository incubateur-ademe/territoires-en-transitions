/**
 * Ligne vide dans le texte source (éventuellement avec espaces).
 * Aligné sur `parseLegacyPlainTextToBlocks` côté UI.
 */
const BLANK_LINE_PATTERN = /\r?\n[ \t]*\r?\n+/;

const escapeHtml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/** Vrai si l'explication est déjà du HTML (déjà migrée via le RichTextEditor). */
export const isExplicationHtml = (explication: string): boolean =>
  explication.trim().startsWith('<');

/**
 * Convertit le texte brut hérité (saisi en BDD dans une textarea avant l'ajout
 * du RichTextEditor) en HTML, en préservant les sauts de ligne et les lignes
 * vides. Sans cette conversion, l'inlining du texte brut dans le commentaire
 * fusionné (déjà en HTML) fait perdre le formatage initial.
 */
export const legacyPlainTextToHtml = (explication: string): string => {
  const sections = explication
    .split(BLANK_LINE_PATTERN)
    .map((section) => section.trim())
    .filter(Boolean);

  const paragraphs: string[] = [];

  for (const section of sections) {
    if (paragraphs.length > 0) {
      paragraphs.push('<p>&nbsp;</p>');
    }
    for (const line of section.split(/\r?\n/)) {
      paragraphs.push(`<p>${escapeHtml(line)}</p>`);
    }
  }

  return paragraphs.length > 0 ? paragraphs.join('\n') : '<p>&nbsp;</p>';
};

/**
 * Normalise une explication source en HTML avant son inlining dans le
 * commentaire fusionné : le HTML déjà migré est conservé tel quel, le texte brut
 * hérité est converti en préservant son formatage.
 */
export const normalizeExplicationToHtml = (explication: string): string =>
  isExplicationHtml(explication)
    ? explication
    : legacyPlainTextToHtml(explication);
