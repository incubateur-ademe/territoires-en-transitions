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
  | { kind: 'ocr'; pageIndexes: number[]; fullScan: boolean }
  | { kind: 'refuse'; scannedPages: number; maxOcrPages: number };

// Au-delà, le document est scanné de bout en bout : sans OCR, rien à lire.
const FULL_SCAN_RATIO = 0.8;

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
  const fullScan = pageIndexes.length >= pages.length * FULL_SCAN_RATIO;
  if (pageIndexes.length > policy.maxOcrPages) {
    // Un PDF texte riche en photos et intercalaires se lit sans OCR ; seul un
    // scan de bout en bout n'a rien d'autre à offrir.
    return fullScan
      ? {
          kind: 'refuse',
          scannedPages: pageIndexes.length,
          maxOcrPages: policy.maxOcrPages,
        }
      : { kind: 'none' };
  }
  return { kind: 'ocr', pageIndexes, fullScan };
};
