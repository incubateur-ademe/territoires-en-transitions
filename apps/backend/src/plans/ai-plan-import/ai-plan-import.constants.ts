export const AI_PLAN_IMPORT_SOURCE_BUCKET = 'ai-plan-import-sources';

export const AI_PLAN_IMPORT_MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export const AI_PLAN_IMPORT_MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024;

export const AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS = 20;

export const AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS_PER_USER = 1;

export const AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY = 10;

/**
 * Pages scannées lues par l'OCR, au plus. Au-delà, on refuse plutôt que de
 * lire une partie du document en silence.
 */
export const AI_PLAN_IMPORT_MAX_OCR_PAGES = 60;

// Événements PostHog du cycle de vie d'un import (émis côté backend :
// l'import continue modale fermée, seul le serveur voit toutes les fins).
export const EVENT_AI_PLAN_IMPORT_STARTED = 'plans:import-ia:started';
export const EVENT_AI_PLAN_IMPORT_SUCCEEDED = 'plans:import-ia:succeeded';
export const EVENT_AI_PLAN_IMPORT_FAILED = 'plans:import-ia:failed';
/** Le plan importé a été relu et validé par un utilisateur. */
export const EVENT_AI_PLAN_IMPORT_VERIFIED = 'plans:import-ia:verified';
