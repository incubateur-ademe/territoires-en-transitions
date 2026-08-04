'use client';

import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback, useState } from 'react';
import {
  getDemarchePcaetDraft,
  updateDemarchePcaetDraft,
} from './demarche-pcaet-draft.storage';
import type {
  DemarchePcaetVoletId,
  PcaetVoletGridState,
  PcaetVoletGridStateUpdate,
} from './demarche-pcaet.types';

const DEFAULT_GRID_STATE: PcaetVoletGridState = {
  referenceYear: null,
  rowOrder: {},
  extraYears: [],
};

const withGridStateDefaults = (
  state: PcaetVoletGridState | undefined
): PcaetVoletGridState => ({ ...DEFAULT_GRID_STATE, ...state });

export const usePcaetGridState = (
  demarcheId: number,
  voletId: DemarchePcaetVoletId
): [PcaetVoletGridState, (apply: PcaetVoletGridStateUpdate) => boolean] => {
  const collectiviteId = useCollectiviteId();
  // Resynchronise l'état quand la cible change : l'App Router réutilise
  // l'instance du composant entre deux routes dynamiques.
  const stateKey = `${collectiviteId}:${demarcheId}:${voletId}`;
  const [loadedStateKey, setLoadedStateKey] = useState(stateKey);
  const [gridState, setGridState] = useState<PcaetVoletGridState>(() =>
    withGridStateDefaults(
      getDemarchePcaetDraft(collectiviteId, demarcheId).gridStates[voletId]
    )
  );
  if (loadedStateKey !== stateKey) {
    setLoadedStateKey(stateKey);
    setGridState(
      withGridStateDefaults(
        getDemarchePcaetDraft(collectiviteId, demarcheId).gridStates[voletId]
      )
    );
  }
  const update = useCallback(
    (apply: PcaetVoletGridStateUpdate): boolean => {
      const updated = updateDemarchePcaetDraft(
        collectiviteId,
        demarcheId,
        (current) => {
          const previous = withGridStateDefaults(current.gridStates[voletId]);
          return {
            gridStates: {
              ...current.gridStates,
              [voletId]: { ...previous, ...apply(previous) },
            },
          };
        }
      );
      setGridState(withGridStateDefaults(updated.gridStates[voletId]));
      return true;
    },
    [collectiviteId, demarcheId, voletId]
  );
  return [gridState, update];
};
