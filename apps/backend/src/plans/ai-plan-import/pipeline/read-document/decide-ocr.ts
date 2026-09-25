import { DocumentPage } from '../document/document-page';

export type OcrPolicy = {
  /** En dessous, la page est tenue pour scannée : une page de plan en fait 1 500 à 4 000. */
  minCharsPerPage: number;
  /** Au-delà, on refuse plutôt que de lire une partie du document en silence. */
  maxOcrPages: number;
};

export const DEFAULT_OCR_POLICY: OcrPolicy = {
  minCharsPerPage: 200,
  maxOcrPages: 60,
};

export type OcrDecision =
  | { kind: 'none' }
  | { kind: 'ocr'; pageIndexes: number[] }
  | { kind: 'refuse'; scannedPages: number; maxOcrPages: number };

/**
 * Quelles pages passer à l'OCR. Le programme d'actions est presque toujours
 * en fin de document : lire seulement les premières pages scannées donnerait
 * un plan vide sans que l'utilisateur comprenne pourquoi, d'où le refus.
 */
export const decideOcr = (
  pages: DocumentPage[],
  policy: OcrPolicy = DEFAULT_OCR_POLICY
): OcrDecision => {
  const pageIndexes = pages
    .filter((page) => page.charCount < policy.minCharsPerPage)
    .map((page) => page.index);
  if (pageIndexes.length === 0) {
    return { kind: 'none' };
  }
  if (pageIndexes.length > policy.maxOcrPages) {
    return {
      kind: 'refuse',
      scannedPages: pageIndexes.length,
      maxOcrPages: policy.maxOcrPages,
    };
  }
  return { kind: 'ocr', pageIndexes };
};
