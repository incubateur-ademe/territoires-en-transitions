import type { JobsOptions } from 'bullmq';

export const DETECT_DOCUMENT_INCLUSION_QUEUE_NAME =
  'demarche_document_inclusion_detection';

export const DETECT_DOCUMENT_INCLUSION_JOB_NAME = 'detect-document-inclusion';

export const DETECT_DOCUMENT_INCLUSION_LOCK_DURATION_MS = 5 * 60 * 1000;

// Les relances d'un appel au modèle sont déjà faites par `LlmService` : un
// échec ici est définitif, la case reste simplement absente.
export const DETECT_DOCUMENT_INCLUSION_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export type DetectDocumentInclusionJobData = {
  detectionId: number;
  /** Le fichier à analyser : un dépôt plus récent rend le job caduc. */
  fichierId: number;
};
