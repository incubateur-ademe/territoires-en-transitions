'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useCallback, useState } from 'react';
import {
  DemarchePcaetUpdatePatch,
  getDemarchePcaet,
  updateDemarchePcaet,
} from './demarche-pcaet.storage';
import type { DemarchePcaet } from './demarche-pcaet.types';

export const useDemarchePcaet = (demarcheId: string) => {
  const { collectiviteId } = useCurrentCollectivite();

  const [demarche, setDemarche] = useState<DemarchePcaet | null>(() =>
    getDemarchePcaet(collectiviteId, demarcheId) ?? null
  );

  const refresh = useCallback(() => {
    setDemarche(getDemarchePcaet(collectiviteId, demarcheId) ?? null);
  }, [collectiviteId, demarcheId]);

  const update = useCallback(
    (patch: DemarchePcaetUpdatePatch) => {
      const updated = updateDemarchePcaet(collectiviteId, demarcheId, patch);
      if (updated) {
        setDemarche(updated);
      }
      return updated;
    },
    [collectiviteId, demarcheId]
  );

  const replaceDemarche = useCallback((next: DemarchePcaet) => {
    setDemarche(next);
  }, []);

  return { demarche, update, refresh, replaceDemarche, collectiviteId };
};
