import {
  estimateCharCount,
  estimateTokenCount,
} from '@tet/backend/utils/llm/estimate-token-count';
import type {
  DocumentPage,
  ReadDocument,
} from '@tet/backend/plans/ai-plan-import/pipeline/document/document-page';
import { detectHeadings } from '@tet/backend/plans/ai-plan-import/pipeline/segment-document/detect-headings';

/** Au-delà, le plan du document est tronqué : il sert à situer, pas à lire. */
const MAX_OUTLINE_TOKENS = 2_000;
/** Entrée totale envoyée au modèle léger, plan compris. */
export const MAX_DETECTION_INPUT_TOKENS = 12_000;
/** Contexte gardé de part et d'autre d'une occurrence. */
const WINDOW_CHARS = 1_200;
/**
 * Une page ne prend jamais plus d'un tiers du budget : un onglet de tableur
 * qui cite le sujet à chaque rangée ne doit pas évincer le reste.
 */
const MAX_PAGE_CHARS = estimateCharCount(MAX_DETECTION_INPUT_TOKENS / 3);
const MAX_HEADING_CHARS = 160;

export type DetectionInput = {
  /** Titres repérés, avec leur page : distingue une section d'une mention. */
  outline: string;
  /** Passages autour des occurrences, page par page. */
  excerpts: string;
  matchCount: number;
};

type PageMatches = { page: DocumentPage; count: number; text: string };

/**
 * Prépare ce que le modèle lira. `null` quand le document ne contient aucune
 * occurrence : il ne peut pas détailler un sujet qu'il ne nomme jamais, inutile
 * de payer un appel pour l'entendre dire.
 */
export const buildDetectionInput = (
  document: ReadDocument,
  keywords: RegExp,
  nonce: string
): DetectionInput | null => {
  const matched = document.pages
    .map((page) => matchPage(page, keywords))
    .filter((entry): entry is PageMatches => entry !== null);
  if (matched.length === 0) {
    return null;
  }

  const outline = renderOutline(document.pages, keywords);
  const budget =
    MAX_DETECTION_INPUT_TOKENS -
    Math.min(estimateTokenCount(outline), MAX_OUTLINE_TOKENS);

  // Les pages qui parlent le plus du sujet d'abord : c'est là qu'une section
  // dédiée se trouve, si elle existe.
  const retained: PageMatches[] = [];
  let used = 0;
  for (const entry of [...matched].sort((a, b) => b.count - a.count)) {
    const block = renderPage(entry, nonce);
    const tokens = estimateTokenCount(block);
    if (used + tokens > budget) {
      continue;
    }
    retained.push(entry);
    used += tokens;
  }

  return {
    outline: truncateToTokens(outline, MAX_OUTLINE_TOKENS),
    excerpts: retained
      .sort((a, b) => a.page.index - b.page.index)
      .map((entry) => renderPage(entry, nonce))
      .join('\n'),
    matchCount: matched.reduce((total, { count }) => total + count, 0),
  };
};

const matchPage = (
  page: DocumentPage,
  keywords: RegExp
): PageMatches | null => {
  const hits = [...page.text.matchAll(toGlobal(keywords))];
  if (hits.length === 0) {
    return null;
  }
  const text = extractWindows(page.text, hits);
  return {
    page,
    count: hits.length,
    text:
      text.length > MAX_PAGE_CHARS
        ? `${text.slice(0, MAX_PAGE_CHARS)} […]`
        : text,
  };
};

/** Fenêtres autour des occurrences, fusionnées quand elles se recouvrent. */
const extractWindows = (text: string, hits: RegExpMatchArray[]): string => {
  const windows: Array<[number, number]> = [];
  for (const hit of hits) {
    const start = Math.max(0, (hit.index ?? 0) - WINDOW_CHARS);
    const end = Math.min(
      text.length,
      (hit.index ?? 0) + hit[0].length + WINDOW_CHARS
    );
    const last = windows[windows.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      windows.push([start, end]);
    }
  }
  return windows
    .map(([start, end]) =>
      [
        start > 0 ? '[…] ' : '',
        text.slice(start, end).trim(),
        end < text.length ? ' […]' : '',
      ].join('')
    )
    .join('\n');
};

/** Le numéro sous lequel le modèle voit la page, et qu'il renvoie. */
const pageNumero = (page: DocumentPage): string =>
  page.label ?? String(page.index + 1);

/**
 * Ne garde des pages citées par le modèle que celles qui existent, dans l'ordre
 * du document et sans doublon.
 */
export const keepDocumentPages = (
  document: ReadDocument,
  cited: readonly string[]
): string[] => {
  const wanted = new Set(cited.map((numero) => numero.trim()));
  return document.pages
    .map(pageNumero)
    .filter(
      (numero, index, all) =>
        wanted.has(numero) && all.indexOf(numero) === index
    );
};

const renderPage = ({ page, text }: PageMatches, nonce: string): string =>
  [
    `<page numero="${pageNumero(page)}" nonce="${nonce}">`,
    text,
    '</page>',
  ].join('\n');

const renderOutline = (pages: DocumentPage[], keywords: RegExp): string =>
  detectHeadings(pages)
    .map(({ pageIndex, lineIndex, lastLineIndex }) => {
      const page = pages[pageIndex];
      const titre = page.lines
        .slice(lineIndex, lastLineIndex + 1)
        .map(({ text }) => text.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .slice(0, MAX_HEADING_CHARS);
      const marque = toGlobal(keywords).test(titre) ? ' ◀' : '';
      return `- p. ${pageNumero(page)} : ${titre}${marque}`;
    })
    .join('\n');

const truncateToTokens = (text: string, maxTokens: number): string => {
  if (estimateTokenCount(text) <= maxTokens) {
    return text;
  }
  const lines = text.split('\n');
  const kept: string[] = [];
  for (const line of lines) {
    if (estimateTokenCount([...kept, line].join('\n')) > maxTokens) {
      break;
    }
    kept.push(line);
  }
  return [...kept, '- […]'].join('\n');
};

const toGlobal = (pattern: RegExp): RegExp =>
  new RegExp(
    pattern.source,
    pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  );
