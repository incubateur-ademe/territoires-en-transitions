import type { JobsOptions } from 'bullmq';

export const SCAN_FICHIERS_QUEUE_NAME = 'fichier_scan';

export const SWEEP_FICHIERS_JOB_NAME = 'sweep';

/** Analyse d'un fichier juste déposé, sans attendre le balayage. */
export const SCAN_FICHIER_JOB_NAME = 'scan-fichier';

export type ScanFichierJobData = {
  collectiviteId: number;
  hash: string;
};

/**
 * Identifiant fixe : tant qu'un balayage est en file ou en cours, le suivant
 * est ignoré par BullMQ, et deux balayages ne se chevauchent jamais.
 */
export const SWEEP_FICHIERS_JOB_ID = 'sweep-fichiers';

/** Un même fichier redéposé avant son analyse n'est mis en file qu'une fois. */
export const getScanFichierJobId = ({
  collectiviteId,
  hash,
}: ScanFichierJobData): string => `scan-fichier-${collectiviteId}-${hash}`;

export const SCAN_FICHIERS_LOCK_DURATION_MS = 10 * 60 * 1000;

// Aucun job conservé : un job échoué gardé sous l'identifiant fixe bloquerait
// tous les balayages suivants. Le prochain cron rattrape l'échec.
export const SCAN_FICHIERS_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: true,
  removeOnFail: true,
};

// clamd peut redémarrer (rechargement des signatures) : quelques reprises
// espacées, puis le balayage prend le relais.
export const SCAN_FICHIER_JOB_OPTIONS: JobsOptions = {
  ...SCAN_FICHIERS_JOB_OPTIONS,
  attempts: 3,
  backoff: { type: 'exponential', delay: 60_000 },
};
