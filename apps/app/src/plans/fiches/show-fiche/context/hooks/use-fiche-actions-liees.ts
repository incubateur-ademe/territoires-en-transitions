import {
  FicheListItem,
  useListFiches,
} from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useCallback } from 'react';
import { useUpdateFichesActionLiees } from '../../data/useFichesActionLiees';
import { ActionsLieesState } from '../types';

export const useFicheActionsLiees = (
  collectiviteId: number,
  ficheId: number
): ActionsLieesState => {
  const { fiches: list, isLoading } = useListFiches(collectiviteId, {
    filters: {
      linkedFicheIds: [ficheId],
    },
  });

  const { mutate: update } = useUpdateFichesActionLiees(ficheId);

  const updateActionLiee = useCallback(
    (ficheToToggle: FicheListItem) => {
      const currentFiches = list;
      const isFicheAlreadyLinked =
        currentFiches.some((f) => f.id === ficheToToggle.id) ?? false;

      const updatedFicheIds = isFicheAlreadyLinked
        ? currentFiches
            .filter((f) => f.id !== ficheToToggle.id)
            .map((f) => f.id)
        : [...currentFiches, ficheToToggle].map((f) => f.id);

      update(updatedFicheIds);
    },
    [list, update]
  );

  return {
    list,
    isLoading,
    update,
    updateActionLiee,
  };
};
