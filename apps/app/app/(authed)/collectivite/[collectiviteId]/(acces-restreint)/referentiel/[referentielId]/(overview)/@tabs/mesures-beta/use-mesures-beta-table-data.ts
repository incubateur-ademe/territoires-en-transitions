'use client';

import { useCollectiviteId } from '@tet/api/collectivites';
import {
  ActionTypeEnum,
  flatMapActionsEnfants,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { useMemo } from 'react';
import { actionNewToDeprecated } from '@/app/referentiels/DEPRECATED_scores.types';
import { useSaveActionStatut } from '@/app/referentiels/actions/action-statut/use-action-statut';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useSnapshot } from '@/app/referentiels/use-snapshot';

export type MesureBetaRow = ReturnType<typeof actionNewToDeprecated>;

export const useMesuresBetaTableData = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  const { data: snapshot, isPending } = useSnapshot({
    actionId: referentielId,
  });

  const { saveActionStatut, isLoading: isSaving } = useSaveActionStatut();

  const flatRows = useMemo(() => {
    if (!snapshot) return [];
    return flatMapActionsEnfants(snapshot.scoresPayload.scores).map(
      actionNewToDeprecated
    );
  }, [snapshot]);

  // Filter to show only sous-actions and tâches (editable items)
  const data = useMemo(
    () =>
      flatRows.filter(
        (row) =>
          row.type === ActionTypeEnum.SOUS_ACTION ||
          row.type === ActionTypeEnum.TACHE
      ),
    [flatRows]
  );

  const updateStatut = (actionId: string, avancement: string) => {
    saveActionStatut({
      collectiviteId,
      actionId,
      avancement:
        avancement === StatutAvancementEnum.NON_CONCERNE
          ? StatutAvancementEnum.NON_RENSEIGNE
          : avancement,
      avancementDetaille:
        avancement === StatutAvancementEnum.DETAILLE ? [0.25, 0.5, 0.25] : undefined,
      concerne: avancement !== StatutAvancementEnum.NON_CONCERNE,
    });
  };

  return {
    data,
    isLoading: isPending,
    isSaving,
    updateStatut,
    referentielId,
  };
};
