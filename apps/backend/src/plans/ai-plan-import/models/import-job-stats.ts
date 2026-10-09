import { TokenUsage } from '@tet/backend/utils/llm/token-usage';
import { DocumentKind } from '../pipeline/document/document-page';
import { ContentMetrics } from '../pipeline/compute-import-metrics';

/** Résumé chiffré d'un import, gardé sur le job pour les statistiques. */
export type ImportJobStats = {
  schemaVersion: 1;
  /** Absent quand l'import a échoué avant l'extraction. */
  content:
    | (ContentMetrics & {
        /** Actions extraites, avant l'écart des doublons. */
        extracted: number;
        duplicates: number;
        truncatedTitles: number;
        /** Actions notées par la vérification, et parmi elles reprises. */
        scored: number;
        improved: number;
        /** Fiches créées : actions et sous-actions. */
        fichesCreated: number;
        hasQualitativeReview: boolean;
      })
    | null;
  /** Absent quand le fichier n'a pas pu être lu. */
  document: {
    kind: DocumentKind;
    mimeType: string;
    sizeBytes: number;
    pageCount: number;
    textPages: number;
    ocrPages: number;
    emptyPages: number;
    ocrFailures: number;
    /** Caractères hors espaces. */
    chars: number;
  } | null;
  llm: {
    strategy: string;
    models: string[];
    calls: number;
    failedCalls: number;
    rateLimited: number;
    tokens: TokenUsage;
  };
  warnings: number;
};
