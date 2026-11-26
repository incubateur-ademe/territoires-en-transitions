import type { ReadingStats } from '../../models/model-doubt';
import { isTabularKind, type ReadDocument } from './document-page';

const MAX_UNREADABLE_SHARE = 0.3;
// Sous cette part de vrais mots, le texte est brouillé (OCR raté, police mal
// encodée) même s'il est long.
const MIN_WORD_SHARE = 0.6;
const MIN_WORD_LETTERS = 3;
const VOWEL = /[aeiouyàâäéèêëîïôöùûüœæ]/iu;
const WORD = /^\p{L}+(?:['’-]\p{L}+)*$/u;
// Chiffres, montants, dates, numéros : ni mots ni débris.
const NUMBER = /^[\p{N}.,:/%°€$+-]+$/u;
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

const isWord = (token: string): boolean =>
  WORD.test(token) && (token.length < 4 || VOWEL.test(token));

/**
 * Un texte sans mot lisible : débris d'OCR, caractères brouillés, ou rien
 * qu'un numéro de page. Un titre court mais bien formé (couverture,
 * intercalaire, « Merci de votre attention ») est lisible.
 */
export const isGarbledText = (text: string): boolean => {
  const tokens = text
    .split(/\s+/)
    .map((token) => token.replace(EDGE_PUNCTUATION, ''))
    .filter((token) => token !== '' && !NUMBER.test(token));
  const words = tokens.filter(isWord);
  return (
    !words.some(
      (word) => word.replace(/['’-]/g, '').length >= MIN_WORD_LETTERS
    ) || words.length / tokens.length < MIN_WORD_SHARE
  );
};

/**
 * Les pages sans texte exploitable : vides, en échec d'OCR ou brouillées. Un
 * onglet de tableur court n'est pas illisible : rien à compter.
 */
export const measureReadingStats = (
  document: ReadDocument
): ReadingStats | undefined => {
  if (isTabularKind(document.kind) || document.pages.length === 0) {
    return undefined;
  }
  const failed = new Set(
    document.ocrFailures.map(({ pageIndex }) => pageIndex)
  );
  return {
    pageCount: document.pages.length,
    unreadablePages: document.pages.filter(
      (page) =>
        failed.has(page.index) ||
        page.source === 'empty' ||
        isGarbledText(page.text)
    ).length,
  };
};

/** Assez de pages illisibles pour que le modèle ait raison de s'arrêter. */
export const isMostlyUnreadable = (stats: ReadingStats | undefined): boolean =>
  stats !== undefined &&
  stats.pageCount > 0 &&
  stats.unreadablePages / stats.pageCount >= MAX_UNREADABLE_SHARE;
