import type { SheetGrid } from '../analyze-workbook/sheet-grid';

/** Coordonnées dans la source, avant nettoyage et découpage du texte. */
export type DocumentLocation = {
  /** À partir de 0 ; pour Word, section logique ouverte par un titre H1. */
  pageIndex: number;
  /** Ligne d'origine à partir de 0, jamais recalculée après normalisation. */
  lineIndex?: number;
  sheetName?: string;
  /** Cellule d'origine, numérotée à partir de 1. */
  row?: number;
  col?: number;
  /** Rectangle PDF natif [x1, y1, x2, y2], origine en bas à gauche. */
  rect?: [number, number, number, number];
};

export type DocumentLink = {
  text: string;
  /** null signale une destination illisible, jamais déduite du libellé. */
  target: string | null;
  kind: 'hyperlink' | 'text';
  location: DocumentLocation;
};

export type PageLine = {
  text: string;
  locations?: DocumentLocation[];
  links?: DocumentLink[];
  /** Taille de police médiane de la ligne, PDF texte seulement. */
  fontSize?: number;
  /** Ordonnée depuis le haut de la page, en unités PDF. */
  y?: number;
};

export type DocumentPage = {
  /** 0-based ; la page affichée est `index + 1`. */
  index: number;
  text: string;
  lines: PageLine[];
  source: 'text' | 'ocr' | 'empty';
  /** Caractères hors espaces : ce qui départage une page vide d'une page lue. */
  charCount: number;
  /** Nom de la feuille pour un tableur. */
  label?: string;
  width?: number;
  height?: number;
  /** Tous les liens lus, y compris ceux sans texte ou dans une marge retirée. */
  links?: DocumentLink[];
};

export type DocumentKind = 'pdf' | 'docx' | 'xlsx' | 'csv';

/** Un tableur, Excel ou CSV : une page par onglet, une ligne par rangée. */
export const isTabularKind = (kind: DocumentKind): boolean =>
  kind === 'xlsx' || kind === 'csv';

export type ReadDocument = {
  kind: DocumentKind;
  pages: DocumentPage[];
  stats: {
    pageCount: number;
    textPages: number;
    ocrPages: number;
    emptyPages: number;
  };
  /** Pages dont la transcription a échoué, gardées telles que pdf.js les a lues. */
  ocrFailures: { pageIndex: number; reason: string }[];
  /**
   * Un tableur : une grille par page, dans le même ordre. Elle ne sert qu'à
   * la lecture et n'entre jamais dans le point de reprise.
   */
  workbook?: SheetGrid[];
};

export const buildPage = (
  index: number,
  lines: PageLine[],
  extra: Partial<
    Pick<DocumentPage, 'source' | 'label' | 'width' | 'height' | 'links'>
  > = {}
): DocumentPage => {
  const text = lines.map((line) => line.text).join('\n');
  const charCount = text.replace(/\s/g, '').length;
  const links = extra.links ?? lines.flatMap((line) => line.links ?? []);
  return {
    index,
    text,
    lines,
    source: extra.source ?? (charCount > 0 ? 'text' : 'empty'),
    charCount,
    ...(extra.label !== undefined ? { label: extra.label } : {}),
    ...(extra.width !== undefined ? { width: extra.width } : {}),
    ...(extra.height !== undefined ? { height: extra.height } : {}),
    ...(links.length > 0 ? { links } : {}),
  };
};

export const buildDocument = (
  kind: DocumentKind,
  pages: DocumentPage[],
  ocrFailures: ReadDocument['ocrFailures'] = [],
  workbook?: SheetGrid[]
): ReadDocument => ({
  kind,
  pages,
  ocrFailures,
  ...(workbook ? { workbook } : {}),
  stats: {
    pageCount: pages.length,
    textPages: pages.filter((page) => page.source === 'text').length,
    ocrPages: pages.filter((page) => page.source === 'ocr').length,
    emptyPages: pages.filter((page) => page.source === 'empty').length,
  },
});

/** Le texte du document, une page après l'autre ; chaque onglet d'un tableur annoncé. */
export const joinPages = (document: ReadDocument): string =>
  document.pages
    .filter((page) => page.text.trim().length > 0)
    .map((page) =>
      isTabularKind(document.kind) && page.label
        ? `${sheetMarker(page.label)}\n${page.text}`
        : page.text
    )
    .join('\n');

export const sheetMarker = (label: string): string => `[Onglet « ${label} »]`;
