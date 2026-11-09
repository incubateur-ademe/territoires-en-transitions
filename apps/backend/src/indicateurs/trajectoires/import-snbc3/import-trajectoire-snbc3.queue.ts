import type { JobsOptions } from 'bullmq';
import { ImportTrajectoireSnbc3Input } from './import-trajectoire-snbc3.input';

export const IMPORT_TRAJECTOIRE_SNBC3_QUEUE_NAME = 'trajectoire_snbc3_import';

export const IMPORT_TRAJECTOIRE_SNBC3_JOB_NAME = 'import-trajectoire-snbc3';

/**
 * Id fixe : un seul job d'import peut exister dans la file. Le job terminé est
 * retiré par la mise en file suivante (`EnqueueImportTrajectoireSnbc3Service`).
 */
export const IMPORT_TRAJECTOIRE_SNBC3_JOB_ID = 'import-trajectoire-snbc3';

/**
 * Le worker renouvelle son verrou tant que le process vit : ce délai ne borne
 * pas l'import (8 min en local quand tout change), il fixe le temps au bout
 * duquel un job dont le process est mort (redéploiement) est repris.
 */
export const IMPORT_TRAJECTOIRE_SNBC3_LOCK_DURATION_MS = 10 * 60 * 1000;

/**
 * Pas de nouvelle tentative sur échec : une erreur de release ne se corrige
 * pas seule, et l'import est relancé à la main. Un job interrompu par la mort
 * du process est en revanche repris une fois (`maxStalledCount`) : l'import
 * est idempotent.
 */
export const IMPORT_TRAJECTOIRE_SNBC3_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
  removeOnComplete: { age: 7 * 24 * 3600 },
  removeOnFail: { age: 7 * 24 * 3600 },
};

export type ImportTrajectoireSnbc3JobData = ImportTrajectoireSnbc3Input;
