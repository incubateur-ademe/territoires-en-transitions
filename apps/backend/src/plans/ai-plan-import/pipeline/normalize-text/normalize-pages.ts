import { buildPage, DocumentPage } from '../document/document-page';

const LIGATURES: Record<string, string> = {
  '\uFB00': 'ff',
  '\uFB01': 'fi',
  '\uFB02': 'fl',
  '\uFB03': 'ffi',
  '\uFB04': 'ffl',
};

// Une ligne d'en-tête ou de pied de page revient sur une bonne part des pages,
// au même endroit ; ses chiffres (numéro de page, date) varient seuls.
const REPEATED_LINE_MIN_PAGES = 5;
const REPEATED_LINE_MIN_RATIO = 0.3;
// Quand la position est connue, seule une ligne dans la marge haute ou basse
// peut être un en-tête ou un pied de page.
const EDGE_RATIO = 0.08;
const PAGE_NUMBER_LINE =
  /^\s*(?:page\s*)?(\d{1,3}|[ivxlc]{1,6})(?:\s*\/\s*\d{1,3})?\s*$/i;

/**
 * Nettoie ce que la conversion d'un PDF laisse derrière elle : ligatures,
 * césures en fin de ligne, en-têtes et pieds de page répétés, numéros de page.
 */
export const normalizePages = (pages: DocumentPage[]): DocumentPage[] => {
  const repeatedFirst = repeatedLineKeys(pages, 'top');
  const repeatedLast = repeatedLineKeys(pages, 'bottom');

  return pages.map((page) => {
    if (page.source === 'empty') {
      return page;
    }
    let lines = page.lines.map((line) => ({
      ...line,
      text: cleanText(line.text),
    }));
    lines = dropEdgeLines(page, lines, repeatedFirst, repeatedLast);
    lines = dehyphenate(lines);
    return buildPage(page.index, lines, page);
  });
};

const cleanText = (text: string): string =>
  text
    .replace(/[\uFB00-\uFB04]/g, (ligature) => LIGATURES[ligature] ?? ligature)
    .replace(/\u00A0/g, ' ')
    // Les tabulations séparent les colonnes d'un tableur : on ne touche qu'aux espaces.
    .replace(/ {2,}/g, ' ')
    .trim();

/** Clé d'une ligne : minuscules, chiffres remplacés, pour reconnaître ses répétitions. */
const lineKey = (text: string): string =>
  cleanText(text).toLowerCase().replace(/\d+/g, '#');

type Edge = 'top' | 'bottom';

const edgeLine = (
  page: DocumentPage,
  lines: DocumentPage['lines'],
  edge: Edge
): DocumentPage['lines'][number] | undefined => {
  const line = edge === 'top' ? lines[0] : lines.at(-1);
  if (!line || line.y === undefined || page.height === undefined) {
    return line;
  }
  const inMargin =
    edge === 'top'
      ? line.y <= page.height * EDGE_RATIO
      : line.y >= page.height * (1 - EDGE_RATIO);
  return inMargin ? line : undefined;
};

const repeatedLineKeys = (pages: DocumentPage[], edge: Edge): Set<string> => {
  const textPages = pages.filter((page) => page.source !== 'empty');
  if (textPages.length < REPEATED_LINE_MIN_PAGES) {
    return new Set();
  }
  const counts = new Map<string, number>();
  for (const page of textPages) {
    const line = edgeLine(page, page.lines, edge);
    if (!line) continue;
    const key = lineKey(line.text);
    if (key.length === 0) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const minPages = Math.max(
    3,
    Math.ceil(textPages.length * REPEATED_LINE_MIN_RATIO)
  );
  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count >= minPages)
      .map(([key]) => key)
  );
};

const dropEdgeLines = (
  page: DocumentPage,
  lines: DocumentPage['lines'],
  repeatedFirst: Set<string>,
  repeatedLast: Set<string>
): DocumentPage['lines'] => {
  let result = lines;
  const first = edgeLine(page, result, 'top');
  if (
    first &&
    (repeatedFirst.has(lineKey(first.text)) ||
      PAGE_NUMBER_LINE.test(first.text))
  ) {
    result = result.slice(1);
  }
  const last = edgeLine(page, result, 'bottom');
  if (
    last &&
    (repeatedLast.has(lineKey(last.text)) || PAGE_NUMBER_LINE.test(last.text))
  ) {
    result = result.slice(0, -1);
  }
  return result;
};

// « dévelop- » + « pement » : un tiret en fin de ligne suivi d'une minuscule.
// Un tiret de liste ou un mot composé (« Saint-\nMartin ») n'est pas touché.
const dehyphenate = (lines: DocumentPage['lines']): DocumentPage['lines'] => {
  const result: DocumentPage['lines'] = [];
  for (const line of lines) {
    const previous = result.at(-1);
    if (
      previous &&
      /\p{L}{2,}-$/u.test(previous.text) &&
      /^\p{Ll}{2,}/u.test(line.text)
    ) {
      result[result.length - 1] = {
        ...previous,
        text: previous.text.slice(0, -1) + line.text,
      };
    } else {
      result.push(line);
    }
  }
  return result;
};
