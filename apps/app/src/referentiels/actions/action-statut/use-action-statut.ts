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

  const [actionStatutFromScore, setActionStatutFromScore] = useState<
    | {
        statut: ActionStatut | null;
        filled: boolean | null;
        filledByChildren: string[] | null;
        isLoading: false;
      }
    | {
        statut: null;
        filled: null;
        filledByChildren: null;
        isLoading: true;
      }
  >({
    statut: null,
    filled: null,
    filledByChildren: null,
    isLoading: true,
  });

  const { data: snapshot, isPending: isLoadingSnapshot } = useSnapshot({
    actionId,
  });

  useEffect(() => {
    const actionScore = snapshot?.scoresPayload.scores
      ? findActionInTree(
          [snapshot.scoresPayload.scores],
          (a) => a.actionId === actionId
        ) ?? null
      : null;
    if (!actionScore || isLoadingSnapshot) {
      setActionStatutFromScore({
        statut: null,
        filled: null,
        filledByChildren: null,
        isLoading: true,
      });
    } else {
      const actionStatutFromScore = getActionStatutFromActionScore(
        collectiviteId,
        actionScore
      );
      setActionStatutFromScore({
        statut: actionStatutFromScore?.actionStatut ?? null,
        filled: actionStatutFromScore?.filled ?? null,
        filledByChildren: actionStatutFromScore?.filledByChildren ?? null,
        isLoading: false,
      });
    }
  }, [snapshot, isLoadingSnapshot, actionId, collectiviteId]);

  return actionStatutFromScore;
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
      // Les invalidations de l'historique sont placées dans `onSettled` et
      // awaitées, alignées sur le pattern de
      // `useSetPersonnalisationJustification` : on veut rafraîchir
      // l'historique même si la mutation a échoué (cas optimistique avec
      // rollback) et garantir que la promesse de mutation ne se résout
      // qu'une fois le cache à jour, pour éviter qu'un caller chaîné voie
      // l'ancien état.
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.historique.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.historique.listUtilisateurs.queryKey(),
        });
      },
    })
  );

  return {
    isLoading: isPending,
    saveActionStatut,
  };
};

export const useSaveActionStatuts = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.referentiels.actions.updateStatuts.mutationOptions({
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
      // Voir useSaveActionStatut : invalidations historique dans
      // `onSettled` + awaitées pour conserver la cohérence du cache même
      // en cas d'échec de la mutation et bloquer la résolution tant que
      // les requêtes historique n'ont pas été marquées stales.
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.historique.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.referentiels.historique.listUtilisateurs.queryKey(),
        });
      },
    })
  );
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
