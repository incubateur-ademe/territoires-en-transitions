'use client';

import { useCallback, useState } from 'react';
import { useCollectiviteId } from '@tet/api/collectivites';
import type {
  DemarchePcaetVoletId,
  PcaetVoletGridState,
  PcaetVoletGridStateUpdate,
} from './demarche-pcaet.types';
import {
  getDemarchePcaet,
  updateDemarchePcaet,
} from './demarche-pcaet.storage';

const DEFAULT_GRID_STATE: PcaetVoletGridState = {
  referenceYear: null,
  rowOrder: {},
};

const withGridStateDefaults = (
  state: PcaetVoletGridState | undefined
): PcaetVoletGridState => ({ ...DEFAULT_GRID_STATE, ...state });

export const usePcaetGridState = (
  demarcheId: string,
  voletId: DemarchePcaetVoletId
): [PcaetVoletGridState, (apply: PcaetVoletGridStateUpdate) => boolean] => {
  const collectiviteId = useCollectiviteId();
  const [gridState, setGridState] = useState<PcaetVoletGridState>(() =>
    withGridStateDefaults(
      getDemarchePcaet(collectiviteId, demarcheId)?.gridStates[voletId]
    )
  );
  const update = useCallback(
    (apply: PcaetVoletGridStateUpdate): boolean => {
      const updated = updateDemarchePcaet(
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
      if (!updated) {
        return false;
      }
      setGridState(withGridStateDefaults(updated.gridStates[voletId]));
      return true;
    },
    [collectiviteId, demarcheId, voletId]
  );
  return [gridState, update];
};
