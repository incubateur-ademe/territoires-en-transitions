'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useCallback, useState } from 'react';
import {
  DemarchePcaetUpdatePatch,
  getDemarchePcaet,
  setDemarchePcaetStatutPublication,
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

  const publish = useCallback(() => {
    const updated = setDemarchePcaetStatutPublication(
      collectiviteId,
      demarcheId,
      'publie'
    );
    if (updated) {
      setDemarche(updated);
    }
  }, [collectiviteId, demarcheId]);

  const unpublish = useCallback(() => {
    const updated = setDemarchePcaetStatutPublication(
      collectiviteId,
      demarcheId,
      'brouillon'
    );
    if (updated) {
      setDemarche(updated);
    }
  }, [collectiviteId, demarcheId]);

  return {
    demarche,
    update,
    refresh,
    replaceDemarche,
    publish,
    unpublish,
    collectiviteId,
  };
};
