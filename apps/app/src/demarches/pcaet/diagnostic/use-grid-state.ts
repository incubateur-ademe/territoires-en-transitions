'use client';

import { useCollectiviteId } from '@tet/api/collectivites';
import { useCallback, useState } from 'react';
import {
  getDemarchePcaetDraft,
  updateDemarchePcaetDraft,
} from '../draft.storage';
import type {
  DemarchePcaetTopicId,
  PcaetTopicGridState,
  PcaetTopicGridStateUpdate,
} from '@/app/demarches/types';

const DEFAULT_GRID_STATE: PcaetTopicGridState = {
  referenceYear: null,
  rowOrder: {},
  extraYears: [],
};

const withGridStateDefaults = (
  state: PcaetTopicGridState | undefined
): PcaetTopicGridState => ({ ...DEFAULT_GRID_STATE, ...state });

export const usePcaetGridState = (
  demarcheId: number,
  topicId: DemarchePcaetTopicId
): [PcaetTopicGridState, (apply: PcaetTopicGridStateUpdate) => boolean] => {
  const collectiviteId = useCollectiviteId();
  // Resynchronise l'état quand la cible change : l'App Router réutilise
  // l'instance du composant entre deux routes dynamiques.
  const stateKey = `${collectiviteId}:${demarcheId}:${topicId}`;
  const [loadedStateKey, setLoadedStateKey] = useState(stateKey);
  const [gridState, setGridState] = useState<PcaetTopicGridState>(() =>
    withGridStateDefaults(
      getDemarchePcaetDraft(collectiviteId, demarcheId).gridStates[topicId]
    )
  );
  if (loadedStateKey !== stateKey) {
    setLoadedStateKey(stateKey);
    setGridState(
      withGridStateDefaults(
        getDemarchePcaetDraft(collectiviteId, demarcheId).gridStates[topicId]
      )
    );
  }
  const update = useCallback(
    (apply: PcaetTopicGridStateUpdate): boolean => {
      const updated = updateDemarchePcaetDraft(
        collectiviteId,
        demarcheId,
        (current) => {
          const previous = withGridStateDefaults(current.gridStates[topicId]);
          return {
            gridStates: {
              ...current.gridStates,
              [topicId]: { ...previous, ...apply(previous) },
            },
          };
        }
      );
      setGridState(withGridStateDefaults(updated.gridStates[topicId]));
      return true;
    },
    [collectiviteId, demarcheId, topicId]
  );
  return [gridState, update];
};
