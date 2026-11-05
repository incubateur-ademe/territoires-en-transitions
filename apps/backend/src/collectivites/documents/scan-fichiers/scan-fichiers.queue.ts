import type { JobsOptions } from 'bullmq';

export const SCAN_FICHIERS_QUEUE_NAME = 'fichier_scan';

export const SWEEP_FICHIERS_JOB_NAME = 'sweep';

/**
 * Identifiant fixe : tant qu'un balayage est en file ou en cours, le suivant
 * est ignoré par BullMQ, et deux balayages ne se chevauchent jamais.
 */
export const SWEEP_FICHIERS_JOB_ID = 'sweep-fichiers';

export const SCAN_FICHIERS_LOCK_DURATION_MS = 10 * 60 * 1000;

// Aucun job conservé : un job échoué gardé sous l'identifiant fixe bloquerait
// tous les balayages suivants. Le prochain cron rattrape l'échec.
export const SCAN_FICHIERS_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: true,
  removeOnFail: true,
};
