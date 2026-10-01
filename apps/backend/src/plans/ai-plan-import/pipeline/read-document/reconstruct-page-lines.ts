import { PageLine } from '../document/document-page';

/** Ce que pdf.js rend pour un fragment de texte (`TextItem`). */
export type TextItemLike = {
  str: string;
  /** Matrice [a, b, c, d, x, y] : la taille de police est |d|, l'origine (x, y) depuis le bas. */
  transform: number[];
  width: number;
  height: number;
};

type PositionedItem = {
  text: string;
  x: number;
  right: number;
  y: number;
  fontSize: number;
};

// Deux fragments sont sur la même ligne si leurs ordonnées diffèrent de moins
// d'une demi-hauteur de police ; ils sont séparés d'un espace si le blanc
// entre eux dépasse une fraction de cette hauteur (pdf.js coupe souvent aux
// mots sans rendre l'espace).
const SAME_LINE_TOLERANCE = 0.5;
const WORD_GAP_RATIO = 0.15;
// Un texte dessiné deux fois au même endroit (contour, faux gras) sortirait
// en double : « ÉTATÉTAT ».
const OVERPRINT_TOLERANCE = 0.2;
// Deux colonnes de texte côte à côte : un blanc de plus de deux hauteurs de
// police entre deux morceaux qui portent chacun du texte. Un numéro ou un
// libellé court (« Pilote ») reste sur la ligne de sa valeur.
const COLUMN_GAP_RATIO = 2;
const COLUMN_MIN_LETTERS = 10;

/**
 * Recompose les lignes d'une page à partir des fragments de pdf.js, dans
 * l'ordre de lecture haut → bas puis gauche → droite. Les mises en page à
 * deux colonnes ressortent entrelacées, mais chaque colonne garde ses
 * lignes : un titre n'absorbe pas le texte de la colonne voisine.
 */
export const reconstructPageLines = (
  items: TextItemLike[],
  pageHeight: number
): PageLine[] => {
  const positioned = items
    .filter((item) => item.str.length > 0)
    .map(toPositionedItem(pageHeight))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const lines: PositionedItem[][] = [];
  for (const item of positioned) {
    const current = lines.at(-1);
    const anchor = current?.[0];
    if (
      anchor &&
      Math.abs(item.y - anchor.y) <=
        SAME_LINE_TOLERANCE * Math.max(anchor.fontSize, item.fontSize, 1)
    ) {
      current.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines
    .map((line) => dropOverprints(line.sort((a, b) => a.x - b.x)))
    .flatMap(splitColumns)
    .map(toPageLine)
    .filter((line) => line.text.length > 0);
};

const toPositionedItem =
  (pageHeight: number) =>
  (item: TextItemLike): PositionedItem => {
    const [, , , d, x, y] = item.transform;
    const fontSize = Math.abs(d) || item.height || 1;
    return {
      text: item.str,
      x,
      right: x + item.width,
      y: pageHeight - y,
      fontSize,
    };
  };

const dropOverprints = (items: PositionedItem[]): PositionedItem[] =>
  items.filter(
    (item, index) =>
      !items
        .slice(0, index)
        .some(
          (kept) =>
            kept.text === item.text &&
            Math.abs(kept.x - item.x) <= OVERPRINT_TOLERANCE * item.fontSize &&
            Math.abs(kept.y - item.y) <= OVERPRINT_TOLERANCE * item.fontSize
        )
  );

const splitColumns = (items: PositionedItem[]): PositionedItem[][] => {
  const segments: PositionedItem[][] = [];
  items.forEach((item, index) => {
    const previous = items[index - 1];
    const isColumnGap =
      previous !== undefined &&
      item.x - previous.right > COLUMN_GAP_RATIO * item.fontSize;
    if (segments.length === 0 || isColumnGap) {
      segments.push([item]);
    } else {
      segments[segments.length - 1].push(item);
    }
  });
  // Un morceau trop court rejoint son voisin de gauche (ou de droite).
  const merged: PositionedItem[][] = [];
  for (const segment of segments) {
    const previous = merged.at(-1);
    if (
      previous &&
      (letterCount(segment) < COLUMN_MIN_LETTERS ||
        letterCount(previous) < COLUMN_MIN_LETTERS)
    ) {
      previous.push(...segment);
    } else {
      merged.push(segment);
    }
  }
  return merged;
};

const letterCount = (items: PositionedItem[]): number =>
  items.reduce(
    (count, item) => count + item.text.replace(/[^\p{L}]/gu, '').length,
    0
  );

const toPageLine = (items: PositionedItem[]): PageLine => {
  let text = '';
  let previous: PositionedItem | null = null;
  for (const item of items) {
    if (previous) {
      const gap = item.x - previous.right;
      const needsSpace =
        gap > WORD_GAP_RATIO * item.fontSize &&
        !text.endsWith(' ') &&
        !item.text.startsWith(' ');
      text += needsSpace ? ` ${item.text}` : item.text;
    } else {
      text = item.text;
    }
    previous = item;
  }
  return {
    text: text.replace(/\s+/g, ' ').trim(),
    fontSize: median(items.map((item) => item.fontSize)),
    y: items[0].y,
  };
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
