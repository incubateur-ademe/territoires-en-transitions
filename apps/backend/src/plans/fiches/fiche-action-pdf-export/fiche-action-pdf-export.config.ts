export const FICHE_ACTION_PDF_EXPORT_CONFIG = {
  jobTimeoutMs: 5 * 60_000,
  maxFiches: 200,
} as const;

export type FicheActionPdfExportConfig =
  typeof FICHE_ACTION_PDF_EXPORT_CONFIG;
