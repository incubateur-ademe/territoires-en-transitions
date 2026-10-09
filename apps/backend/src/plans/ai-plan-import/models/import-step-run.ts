import type { LlmCallEvent } from '@tet/backend/utils/llm/llm-observer';
import type { StepName } from '../pipeline/run-import-pipeline';

export const importStepRunStatusValues = ['ok', 'skipped', 'failed'] as const;

export type ImportStepRunStatus = (typeof importStepRunStatusValues)[number];

/**
 * Les étapes de la pipeline, encadrées de la lecture du fichier (pdf.js, OCR)
 * et de l'enregistrement du plan, faites par le service.
 */
export type ImportTrackedStep = 'document' | StepName | 'persistence';

/** Une étape d'un import, telle qu'elle s'est déroulée. */
export type ImportStepRun = {
  step: ImportTrackedStep;
  status: ImportStepRunStatus;
  startedAt: Date;
  endedAt: Date;
  /** Appels au modèle de l'étape, tentatives en échec comprises. */
  calls: LlmCallEvent[];
  /** Comptes propres à l'étape : actions en entrée et en sortie, lots… */
  details: Record<string, number>;
  error: string | null;
};
