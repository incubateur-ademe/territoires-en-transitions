import { useUser } from '@tet/api/users';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  type ActionDeReference,
  type ActionDeReferenceId,
  actionDeReferenceIdSchema,
  actionDeReferenceSchema,
} from '@tet/domain/shared';
import { useCallback, useMemo } from 'react';
import useLocalStorage from 'react-use/lib/useLocalStorage';
import * as z from 'zod/mini';

export type PreselectionStatus = 'disponible' | 'preselectionnee' | 'ignoree';

const actionAddedToPlanSchema = z.object({
  actionId: actionDeReferenceIdSchema,
  ficheId: z.number(),
  planNom: z.string(),
});

export type ActionAddedToPlan = z.output<typeof actionAddedToPlanSchema>;

export type Preselection = {
  actions: readonly ActionDeReference[];
  statusOf: (actionId: ActionDeReferenceId) => PreselectionStatus;
  addedToPlanOf: (
    actionId: ActionDeReferenceId
  ) => ActionAddedToPlan | undefined;
  add: (action: ActionDeReference) => void;
  remove: (actionId: ActionDeReferenceId) => void;
  ignore: (actionId: ActionDeReferenceId) => void;
  restore: (actionId: ActionDeReferenceId) => void;
  markAddedToPlan: (added: ActionAddedToPlan) => void;
  clearAddedToPlan: (actionId: ActionDeReferenceId) => void;
};

const STORAGE_KEY_PREFIX = 'tet_preselection_actions';

const storedPreselectionSchema = z.object({
  preselected: z.array(actionDeReferenceSchema),
  ignored: z.array(actionDeReferenceIdSchema),
  addedToPlans: z._default(z.array(actionAddedToPlanSchema), []),
});

export type StoredPreselection = z.output<typeof storedPreselectionSchema>;

const EMPTY_PRESELECTION: StoredPreselection = {
  preselected: [],
  ignored: [],
  addedToPlans: [],
};

const toStorageKey = ({
  userId,
  collectiviteId,
}: {
  userId: string;
  collectiviteId: number;
}): string => `${STORAGE_KEY_PREFIX}_${userId}_${collectiviteId}`;

const deserializePreselection = (stored: string): StoredPreselection => {
  try {
    const parsed = storedPreselectionSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : EMPTY_PRESELECTION;
  } catch {
    return EMPTY_PRESELECTION;
  }
};

const readStoredValue = (storageKey: string): string | null => {
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
};

const readStoredPreselection = (storageKey: string): StoredPreselection => {
  const stored = readStoredValue(storageKey);
  if (stored === null) {
    return EMPTY_PRESELECTION;
  }
  return deserializePreselection(stored);
};

const withoutAction = (
  current: StoredPreselection,
  actionId: ActionDeReferenceId
): StoredPreselection => ({
  ...current,
  preselected: current.preselected.filter((action) => action.id !== actionId),
  ignored: current.ignored.filter((id) => id !== actionId),
});

const toStatus = (
  { preselected, ignored }: StoredPreselection,
  actionId: ActionDeReferenceId
): PreselectionStatus => {
  if (preselected.some((action) => action.id === actionId)) {
    return 'preselectionnee';
  }
  if (ignored.includes(actionId)) {
    return 'ignoree';
  }
  return 'disponible';
};

const toAddedToPlan = (
  { addedToPlans }: StoredPreselection,
  actionId: ActionDeReferenceId
): ActionAddedToPlan | undefined =>
  addedToPlans.find((added) => added.actionId === actionId);

const addAction = (
  current: StoredPreselection,
  action: ActionDeReference
): StoredPreselection => {
  const cleared = withoutAction(current, action.id);
  return { ...cleared, preselected: [...cleared.preselected, action] };
};

const ignoreAction = (
  current: StoredPreselection,
  actionId: ActionDeReferenceId
): StoredPreselection => {
  const cleared = withoutAction(current, actionId);
  return { ...cleared, ignored: [...cleared.ignored, actionId] };
};

const clearAddedToPlan = (
  current: StoredPreselection,
  actionId: ActionDeReferenceId
): StoredPreselection => ({
  ...current,
  addedToPlans: current.addedToPlans.filter(
    (added) => added.actionId !== actionId
  ),
});

const markAddedToPlan = (
  current: StoredPreselection,
  added: ActionAddedToPlan
): StoredPreselection => {
  const cleared = clearAddedToPlan(current, added.actionId);
  return { ...cleared, addedToPlans: [...cleared.addedToPlans, added] };
};

export const preselectionRules = {
  empty: EMPTY_PRESELECTION,
  deserialize: deserializePreselection,
  statusOf: toStatus,
  addedToPlanOf: toAddedToPlan,
  add: addAction,
  remove: withoutAction,
  ignore: ignoreAction,
  restore: withoutAction,
  markAddedToPlan,
  clearAddedToPlan,
};

export const usePreselection = (): Preselection => {
  const { id: userId } = useUser();
  const { collectiviteId } = useCurrentCollectivite();
  const storageKey = toStorageKey({ userId, collectiviteId });
  const [stored, setStored] = useLocalStorage<StoredPreselection>(
    storageKey,
    EMPTY_PRESELECTION,
    {
      raw: false,
      serializer: (value) => JSON.stringify(value),
      deserializer: deserializePreselection,
    }
  );
  const preselection = stored ?? EMPTY_PRESELECTION;

  const update = useCallback(
    (transform: (current: StoredPreselection) => StoredPreselection): void => {
      setStored(transform(readStoredPreselection(storageKey)));
    },
    [storageKey, setStored]
  );

  return useMemo(
    () => ({
      actions: preselection.preselected,
      statusOf: (actionId) => toStatus(preselection, actionId),
      addedToPlanOf: (actionId) => toAddedToPlan(preselection, actionId),
      add: (action) => update((current) => addAction(current, action)),
      remove: (actionId) =>
        update((current) => withoutAction(current, actionId)),
      ignore: (actionId) =>
        update((current) => ignoreAction(current, actionId)),
      restore: (actionId) =>
        update((current) => withoutAction(current, actionId)),
      markAddedToPlan: (added) =>
        update((current) => markAddedToPlan(current, added)),
      clearAddedToPlan: (actionId) =>
        update((current) => clearAddedToPlan(current, actionId)),
    }),
    [preselection, update]
  );
};
