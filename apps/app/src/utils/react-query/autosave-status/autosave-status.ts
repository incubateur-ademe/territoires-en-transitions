import type { MutationStatus } from '@tanstack/react-query';
import type { AutosaveStatus } from '@tet/ui';

export type AutosaveState = {
  pendingMutationIds: ReadonlySet<number>;
  lastSettledStatus: 'success' | 'error' | null;
};

export type AutosaveEvent = {
  mutationId: number;
  status: MutationStatus;
};

export const initialAutosaveState: AutosaveState = {
  pendingMutationIds: new Set(),
  lastSettledStatus: null,
};

/** À étaler dans le `meta` des mutations dont l'état alimente un même badge. */
export const autosaveMeta = (autosaveKey: string) => ({ autosaveKey });

export const hasAutosaveKey = (
  meta: Record<string, unknown> | undefined,
  autosaveKey: string
): boolean => meta?.autosaveKey === autosaveKey;

/**
 * Suit les écritures dans l'ordre où elles aboutissent, et non dans celui où
 * elles sont parties : une cellule envoyée avant une autre mais qui échoue
 * après elle doit laisser le badge en erreur.
 */
export const reduceAutosaveState = (
  state: AutosaveState,
  { mutationId, status }: AutosaveEvent
): AutosaveState => {
  if (status === 'pending') {
    if (state.pendingMutationIds.has(mutationId)) {
      return state;
    }
    return {
      ...state,
      pendingMutationIds: new Set(state.pendingMutationIds).add(mutationId),
    };
  }
  if (status === 'success' || status === 'error') {
    const pendingMutationIds = new Set(state.pendingMutationIds);
    pendingMutationIds.delete(mutationId);
    return { pendingMutationIds, lastSettledStatus: status };
  }
  return state;
};

/**
 * Une écriture en vol l'emporte sur tout le reste. Sinon, la dernière aboutie
 * décide : une erreur s'efface dès que la saisie suivante passe.
 */
export const toAutosaveStatus = ({
  pendingMutationIds,
  lastSettledStatus,
}: AutosaveState): AutosaveStatus => {
  if (pendingMutationIds.size > 0) {
    return 'saving';
  }
  if (lastSettledStatus === 'error') {
    return 'error';
  }
  return lastSettledStatus === 'success' ? 'saved' : 'idle';
};
