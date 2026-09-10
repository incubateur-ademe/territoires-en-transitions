import { CronExpression } from '@nestjs/schedule';
import { DefaultJobOptions, JobsOptions } from 'bullmq';
import { CRM_SYNC_JOBS } from '../airtable/airtable-crm-sync.service';

export const CRON_JOBS_QUEUE_NAME = 'cron-jobs';

export const DEFAULT_JOB_OPTIONS: DefaultJobOptions = {
  removeOnComplete: 1000,
  attempts: 10,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};

// Les jobs CRM tournent une fois par jour et sont idempotents : un retry du
// lendemain est plus utile que 10 retries serrés. On limite à 3 tentatives
// pour éviter d'inonder Sentry et de chevaucher la fenêtre du jour suivant
// en cas de panne Airtable.
const CRM_SYNC_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
};

// Le backoff des intentions vit en PostgreSQL et le prochain tick constitue
// le retry. Une seule tentative BullMQ permet à la tentative qui observe
// réellement une intention empoisonnée d'être capturée par Sentry, au lieu
// qu'un retry immédiat ne l'ignore puis masque l'échec.
const FORMULA_RECONCILIATION_JOB_OPTIONS: JobsOptions = {
  attempts: 1,
};

const CRM_SYNC_JOBS_CONFIG = Object.entries(CRM_SYNC_JOBS).map(
  ([name, descriptor]) =>
    ({
      name,
      cronExpression: descriptor.cronExpression,
      data: {},
      jobOptions: CRM_SYNC_JOB_OPTIONS,
    } as const)
);

export const JOBS_CONFIG = [
  {
    name: 'calendly-synchro',
    cronExpression: CronExpression.EVERY_HOUR,
    data: {},
  },
  {
    name: 'connect-synchro',
    cronExpression: CronExpression.EVERY_DAY_AT_1AM,
    data: {},
  },
  {
    name: 'compute-all-outdated-trajectoires',
    cronExpression: CronExpression.EVERY_DAY_AT_1AM,
    data: {},
  },
  {
    name: 'send-notifications',
    cronExpression: CronExpression.EVERY_MINUTE,
    data: {},
  },
  {
    name: 'drain-indicateur-formula-reconciliations',
    cronExpression: CronExpression.EVERY_MINUTE,
    data: {},
    jobOptions: FORMULA_RECONCILIATION_JOB_OPTIONS,
  },
  {
    // Une fois par nuit : la validation du dernier avis clôt le dossier sur le
    // moment, cette passe n'est là que pour les dossiers restés sans avis
    // jusqu'à l'échéance — un délai légal de trois mois, insensible à la
    // latence. Elle rattrape aussi les bascules manquées (statut revenu en
    // arrière, échec au moment de la validation).
    name: 'clore-instructions-pcaet',
    cronExpression: CronExpression.EVERY_DAY_AT_MIDNIGHT,
    data: {},
  },
  {
    // Re-sync quotidien complet du group type PostHog "collectivite" à partir de
    // la table `collectivite`.
    name: 'posthog-collectivites-group-sync',
    cronExpression: CronExpression.EVERY_DAY_AT_2AM,
    data: {},
  },
  {
    // Le 1er janvier à 4 h. `CronExpression` n'a pas de valeur annuelle, d'où
    // l'expression littérale — comme les jobs CRM.
    //
    // La source BANATIC est publiée une fois par an et les périmètres des EPCI
    // à fiscalité propre bougent peu ; le calcul dure une trentaine de secondes
    // sur la queue partagée, ce qui décale d'autant le `send-notifications` de
    // la minute concernée, une fois l'an.
    name: 'import-perimetres-epci',
    cronExpression: '0 4 1 1 *',
    data: {},
  },
  ...CRM_SYNC_JOBS_CONFIG,
] as const;

export type JobConfig = (typeof JOBS_CONFIG)[number];
export type JobName = JobConfig['name'];
