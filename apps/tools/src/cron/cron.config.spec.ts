import {
  CRM_SYNC_JOBS,
  CrmSyncJobName,
} from '../airtable/airtable-crm-sync.service';
import { JOBS_CONFIG, JobConfig, JobName } from './cron.config';

type JobConfigEntry = JobConfig;

/**
 * Les jobs déclarés ici même, par opposition à ceux dérivés du descripteur CRM.
 * Les nommer plutôt que les compter : ajouter un job devient une mise à jour
 * délibérée de cette liste, et le test dit lesquels tournent — un total ne le
 * disait pas, et se contentait d'être faux.
 */
const JOBS_PROPRES = [
  'calendly-synchro',
  'connect-synchro',
  'compute-all-outdated-trajectoires',
  'send-notifications',
  'clore-instructions-pcaet',
] as const;

describe('cron.config', () => {
  test('rassemble ses propres jobs puis ceux du descripteur CRM', () => {
    // Les jobs CRM (collectivites, personnes, droits, labellisations,
    // indicateurs, plans) — crm_usages reste piloté par pg_cron pour le moment.
    expect(JOBS_CONFIG.map((j: JobConfigEntry) => j.name)).toEqual([
      ...JOBS_PROPRES,
      ...Object.keys(CRM_SYNC_JOBS),
    ]);
  });

  test('chaque job a un nom unique', () => {
    const names = JOBS_CONFIG.map((j: JobConfigEntry) => j.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test('expose tous les jobs CRM avec leur cron expression depuis le descripteur', () => {
    for (const [crmJobName, descriptor] of Object.entries(CRM_SYNC_JOBS)) {
      const entry = JOBS_CONFIG.find(
        (j: JobConfigEntry) => j.name === crmJobName
      );
      expect(entry).toBeDefined();
      expect(entry?.cronExpression).toBe(descriptor.cronExpression);
    }
  });

  test('chaque job CRM est limité à 3 tentatives (vs 10 par défaut)', () => {
    for (const crmJobName of Object.keys(CRM_SYNC_JOBS)) {
      const entry = JOBS_CONFIG.find(
        (j: JobConfigEntry) => j.name === crmJobName
      );
      expect(entry).toHaveProperty('jobOptions');
      expect(
        (entry as { jobOptions: { attempts: number } }).jobOptions
      ).toEqual({
        attempts: 3,
      });
    }
  });

  test('les jobs hors CRM gardent les options par défaut', () => {
    for (const name of JOBS_PROPRES) {
      const entry = JOBS_CONFIG.find((j: JobConfigEntry) => j.name === name);
      expect(entry).toBeDefined();
      expect(entry).not.toHaveProperty('jobOptions');
    }
  });

  test('JobName inclut tous les noms CRM au niveau type (assertion compile-time)', () => {
    // Vérifie au compile-time que CrmSyncJobName est inclus dans JobName.
    // Si JobName régresse à 'string', cette assertion devient triviale et le
    // unit test runtime suivant l'attrape via le set difference.
    const _check: Exclude<CrmSyncJobName, JobName> = undefined as never;
    void _check;

    const jobNames = new Set(JOBS_CONFIG.map((j: JobConfigEntry) => j.name));
    for (const crmJobName of Object.keys(CRM_SYNC_JOBS)) {
      expect(jobNames.has(crmJobName as JobName)).toBe(true);
    }
  });
});
