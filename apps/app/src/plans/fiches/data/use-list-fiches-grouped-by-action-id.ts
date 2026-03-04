import { useCollectiviteId } from '@tet/api/collectivites';
import { ActionId } from '@tet/domain/referentiels';
import { useMemo } from 'react';
import {
  FicheListItem,
  useListFiches,
} from '../list-all-fiches/data/use-list-fiches';

export const useListFichesGroupedByActionId = () => {
  const collectiviteId = useCollectiviteId();

  const { fiches, isLoading } = useListFiches(collectiviteId, {
    queryOptions: {
      limit: 'all',
    },
  });

  return useMemo(() => {
    const fichesByActionId: Partial<Record<ActionId, FicheListItem[]>> = {};

    for (const fiche of fiches) {
      const actionIdsForFiche = new Set(
        (fiche.mesures ?? []).map((mesure) => mesure.id as ActionId)
      );

      for (const actionId of actionIdsForFiche) {
        (fichesByActionId[actionId] ??= []).push(fiche);
      }
    }

    return { fichesByActionId, isLoading };
  }, [fiches, isLoading]);
};
