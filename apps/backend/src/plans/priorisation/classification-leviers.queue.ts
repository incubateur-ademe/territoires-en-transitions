import type { JobsOptions } from 'bullmq';

export const CLASSIFICATION_LEVIERS_QUEUE_NAME = 'classification_leviers';

/**
 * Dimensionné par le pire blocage synchrone — parsing d'une grosse réponse
 * Gemini — plus la marge de reconnexion Redis, et non par la durée du job :
 * BullMQ renouvelle le lock toutes les `lockDuration / 2`, donc un `await` long
 * sur un appel HTTP ne le fait pas expirer.
 */
export const CLASSIFICATION_LEVIERS_LOCK_DURATION_MS = 10 * 60 * 1000;

/**
 * `attempts: 1` parce que `LlmService` retente déjà cinq fois avec backoff à
 * l'intérieur de chaque appel : retenter le job re-paierait les lots déjà
 * classés, contrairement à `preuves-archive` où re-télécharger est gratuit.
 */
export const CLASSIFICATION_LEVIERS_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export type ClassificationLeviersJobData = {
  jobId: string;
};
