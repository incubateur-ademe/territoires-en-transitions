import {
  ImportStepStates,
  ImportStepView,
  toImportStepViews,
} from './ai-import-steps.model';

/**
 * Lecture grand public de l'import : quatre étapes là où le pipeline en compte
 * neuf, dont le détail ne parle qu'à l'équipe.
 */
export const importStageValues = [
  'lecture',
  'structure',
  'actions',
  'secteurs',
] as const;

export type ImportStage = (typeof importStageValues)[number];

const STAGE_OF: Record<ImportStepView['name'], ImportStage> = {
  reading: 'lecture',
  scouting: 'structure',
  extraction: 'actions',
  hierarchy: 'actions',
  scoring: 'actions',
  consolidation: 'actions',
  enrichment: 'actions',
  secteurs: 'secteurs',
  qualitativeReview: 'secteurs',
  persistence: 'actions',
};

export type ImportStageView = {
  stage: ImportStage;
  status: 'done' | 'current' | 'waiting' | 'failed';
};

const isFinished = (step: ImportStepView) =>
  step.status === 'done' || step.status === 'skipped';

const toStageStatus = (steps: ImportStepView[]): ImportStageView['status'] => {
  if (steps.some((step) => step.status === 'failed')) return 'failed';
  if (steps.every(isFinished)) return 'done';
  if (steps.some((step) => step.status === 'current' || isFinished(step))) {
    return 'current';
  }
  return 'waiting';
};

export const toImportStageViews = (
  stepStates?: ImportStepStates,
  options: { failed?: boolean } = {}
): ImportStageView[] => {
  const steps = toImportStepViews(stepStates, options);
  return importStageValues.map((stage) => ({
    stage,
    status: toStageStatus(
      steps.filter((step) => STAGE_OF[step.name] === stage)
    ),
  }));
};

/** Part des étapes du pipeline terminées, de 0 à 100. */
export const getImportProgressPercent = (
  stepStates?: ImportStepStates
): number => {
  const steps = toImportStepViews(stepStates);
  return Math.round(
    (steps.filter(isFinished).length / Math.max(steps.length, 1)) * 100
  );
};

/** Étape grand public en cours, ou la dernière une fois l'import fini. */
export const getCurrentImportStage = (stages: ImportStageView[]): ImportStage =>
  stages.find(({ status }) => status === 'current' || status === 'failed')
    ?.stage ??
  stages.find(({ status }) => status === 'waiting')?.stage ??
  importStageValues[importStageValues.length - 1];
