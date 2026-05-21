import type { JobsOptions } from 'bullmq';

export const PREUVES_ARCHIVE_QUEUE_NAME = 'preuves_archive_generation';

/** Verrou large : la génération d'archive est longue (collecte + téléchargement + upload). */
export const PREUVES_ARCHIVE_LOCK_DURATION_MS = 10 * 60 * 1000;

/**
 * Backoff exponentiel à partir de 30s (30s, 60s, 120s) : laisse passer les
 * indisponibilités transitoires d'infra (Supabase 503, réseau, disque) sans
 * pilonner. `attempts: 3` borne un job qui dure ~10 min et lit tout un bucket.
 */
export const PREUVES_ARCHIVE_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 30_000 },
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

export interface PreuvesArchiveJobData {
  archiveId: string;
}
