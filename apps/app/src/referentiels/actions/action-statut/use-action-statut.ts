import { useIsAuditeur } from '@/app/referentiels/audits/useAudit';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import {
  ActionStatut,
  canUpdateActionStatutWithoutPermissionCheck,
  getActionStatutFromActionScore,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum } from '@tet/domain/users';
import { useLabellisationParcours } from '../../labellisations/useLabellisationParcours';
import { useReferentielId } from '../../referentiel-context';
import { useScore, useSnapshot } from '../../use-snapshot';

import { findActionInTree } from '@tet/domain/referentiels';
import { useEffect, useState } from 'react';
/**
 * Charge le statut d'une action
 */
export const useActionStatut = (actionId: string) => {
  const collectiviteId = useCollectiviteId();

  const [actionStatutFromScore, setActionStatutFromScore] = useState<{
    actionStatut: ActionStatut;
    filled: boolean;
  } | null>(null);

  const { data: snapshot, isFetching: isLoadingSnapshot } = useSnapshot({
    actionId,
  });

  const actionScore = snapshot?.scoresPayload.scores
    ? findActionInTree(
        [snapshot.scoresPayload.scores],
        (a) => a.actionId === actionId
      ) ?? null
    : null;

  useEffect(() => {
    if (actionScore) {
      setActionStatutFromScore(
        getActionStatutFromActionScore(collectiviteId, actionScore)
      );
    } else {
      setActionStatutFromScore(null);
    }
  }, [actionScore]);

  return {
    statut: actionStatutFromScore?.actionStatut,
    filled: actionStatutFromScore?.filled,
    isLoading: isLoadingSnapshot,
  };
};

/**
 * Met à jour le statut d'une action
 */
export const useSaveActionStatut = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const queryClient = useQueryClient();

  const trpc = useTRPC();

  const { isPending, mutate: saveActionStatut } = useMutation(
    trpc.referentiels.actions.updateStatut.mutationOptions({
      onSuccess: () => {
        // Invalidate cache for all action statuts
        queryClient.invalidateQueries({
          queryKey: ['action_statut', collectiviteId],
        });

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.snapshots.getCurrent.queryKey({
            collectiviteId,
            referentielId,
          }),
        });
      },
    })
  );

  return {
    isLoading: isPending,
    saveActionStatut,
  };
};

/**
 * Détermine si l'utilisateur a le droit de modifier le statut d'une action
 */
export const useEditActionStatutIsDisabled = (actionId: string) => {
  const { hasCollectivitePermission, collectiviteId } =
    useCurrentCollectivite();
  const referentielId = useReferentielId();
  const parcours = useLabellisationParcours({
    collectiviteId: collectiviteId,
    referentielId: referentielId,
  });
  const isAuditeur = useIsAuditeur();

  const score = useScore(actionId);
  if (!score) {
    return true;
  }

  const canUpdateResult = canUpdateActionStatutWithoutPermissionCheck({
    actions: [{ actionId, desactive: score.desactive }],
    parcoursStatus: parcours?.status,
    isAuditeur,
  });
  if (!canUpdateResult.canUpdate) {
    return true;
  }

  return !hasCollectivitePermission(
    PermissionOperationEnum['REFERENTIELS.MUTATE']
  );
};
