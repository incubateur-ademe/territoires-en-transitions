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

type ImportStepDisplayStatus =
  (typeof importStepDisplayStatusValues)[number];

export type ImportStepView = {
  name: ImportStepName;
  status: ImportStepDisplayStatus;
};

// Un `Record` plutôt qu'une liste : une étape ajoutée côté serveur ne peut
// pas être oubliée ici sans que la compilation le signale.
const STEP_RANK: Record<ImportStepName, number> = {
  reading: 0,
  scouting: 1,
  extraction: 2,
  hierarchy: 3,
  scoring: 4,
  consolidation: 5,
  enrichment: 6,
  qualitativeReview: 7,
};

const STEP_ORDER = (Object.keys(STEP_RANK) as ImportStepName[]).sort(
  (a, b) => STEP_RANK[a] - STEP_RANK[b]
);

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
