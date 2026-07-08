import type { RouterOutput } from '@tet/api';

export type ImportStepStates =
  RouterOutput['plans']['aiImport']['getAiImportStatus']['stepStates'];

export type ImportStepName = keyof ImportStepStates;

type ImportStepState = ImportStepStates[ImportStepName];

export const importStepDisplayStatusValues = [
  'done',
  'skipped',
  'current',
  'waiting',
] as const;

export type ImportStepDisplayStatus =
  (typeof importStepDisplayStatusValues)[number];

export type ImportStepView = {
  name: ImportStepName;
  status: ImportStepDisplayStatus;
};

const STEP_ORDER: ImportStepName[] = [
  'extraction',
  'scoring',
  'consolidation',
  'enrichment',
  'qualitativeReview',
];

export const toImportStepViews = (
  stepStates?: ImportStepStates
): ImportStepView[] => {
  const currentStepName = STEP_ORDER.find(
    (name) => stateOf(stepStates, name) === 'pending'
  );

  return STEP_ORDER.map((name) => ({
    name,
    status: toDisplayStatus(stateOf(stepStates, name), name === currentStepName),
  }));
};

const stateOf = (
  stepStates: ImportStepStates | undefined,
  name: ImportStepName
): ImportStepState => stepStates?.[name] ?? 'pending';

const toDisplayStatus = (
  state: ImportStepState,
  isCurrent: boolean
): ImportStepDisplayStatus => {
  if (state === 'ok') return 'done';
  if (state === 'skipped') return 'skipped';
  return isCurrent ? 'current' : 'waiting';
};
