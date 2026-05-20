import { useListActionsGroupedById } from '@/app/referentiels/actions/use-list-actions-grouped-by-id';
import { ReferentielId } from '@tet/domain/referentiels';
import { useMemo } from 'react';
import {
  getAxesFromActionsById,
  getRepartitionPhasesFromActionsById,
  hasEtatDesLieuxFromAxes,
  useProgressionTableFromActionsById,
} from './referentiel-data.utils';

export function useTableauDeBordReferentielData({
  referentielId,
  collectiviteId,
}: {
  referentielId: ReferentielId;
  collectiviteId: number;
}) {
  const [{ data: actionsById = {}, isPending }] = useListActionsGroupedById({
    referentielIds: [referentielId],
    collectiviteId,
  });

  const axes = useMemo(
    () => getAxesFromActionsById(actionsById, referentielId),
    [actionsById, referentielId]
  );

  const potentiel = actionsById[referentielId]?.score.pointPotentiel;

  const hasEtatDesLieux = useMemo(
    () => hasEtatDesLieuxFromAxes(axes),
    [axes]
  );

  const repartitionPhases = useMemo(
    () => getRepartitionPhasesFromActionsById(actionsById),
    [actionsById]
  );

  const progressionScore = useProgressionTableFromActionsById(
    actionsById,
    referentielId
  );

  return {
    axes,
    potentiel,
    hasEtatDesLieux,
    repartitionPhases,
    progressionScore,
    isPending,
  };
}
