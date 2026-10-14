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
  secteurs: 7,
  qualitativeReview: 8,
};

const STEP_ORDER = (Object.keys(STEP_RANK) as ImportStepName[]).sort(
  (a, b) => STEP_RANK[a] - STEP_RANK[b]
);

// Les secteurs démarrent avec l'enrichissement et tournent à côté de lui puis
// de la revue : deux étapes peuvent être en cours ensemble.
const STARTS_WITH: Partial<Record<ImportStepName, ImportStepName>> = {
  secteurs: 'enrichment',
};

export const toImportStepViews = (
  stepStates?: ImportStepStates
): ImportStepView[] => {
  const isPending = (name: ImportStepName) =>
    stateOf(stepStates, name) === 'pending';
  const currentStepName = STEP_ORDER.find(
    (name) => STARTS_WITH[name] === undefined && isPending(name)
  );
  const currentRank = currentStepName
    ? STEP_RANK[currentStepName]
    : Number.POSITIVE_INFINITY;

  const isCurrent = (name: ImportStepName) => {
    const startsWith = STARTS_WITH[name];
    return startsWith === undefined
      ? name === currentStepName
      : isPending(name) && STEP_RANK[startsWith] <= currentRank;
  };

  return STEP_ORDER.map((name) => ({
    name,
    status: toDisplayStatus(stateOf(stepStates, name), isCurrent(name)),
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
