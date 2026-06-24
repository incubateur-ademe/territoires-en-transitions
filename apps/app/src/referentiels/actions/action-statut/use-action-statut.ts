import { useIsAuditeur } from '@/app/referentiels/audits/useAudit';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import { canUpdateActionStatutWithoutPermissionCheck } from '@tet/domain/referentiels';
import { PermissionOperationEnum } from '@tet/domain/users';
import { useLabellisationParcours } from '../../labellisations/useLabellisationParcours';
import { useReferentielId } from '../../referentiel-context';
import { useGetAction } from '../use-get-action';

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
          queryKey: trpc.referentiels.actions.listActionsGroupedById.queryKey({
            collectiviteId,
            referentielId,
          }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.snapshots.getCurrent.queryKey({
            collectiviteId,
            referentielId,
          }),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
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
/**
 * Shared context for action statut edit permission checks.
 * Call once at the table/page level, then use `isActionStatutEditDisabled`
 * per row with the action's `score.desactive` value.
 */
export const useActionStatutEditContext = () => {
  const { hasCollectivitePermission, collectiviteId } =
    useCurrentCollectivite();
  const referentielId = useReferentielId();
  const { parcours } = useLabellisationParcours({
    collectiviteId,
    referentielId,
  });
  const isAuditeur = useIsAuditeur();

  const hasPermission = hasCollectivitePermission(
    PermissionOperationEnum['REFERENTIELS.MUTATE']
  );

  return { parcoursStatus: parcours?.status, isAuditeur, hasPermission };
};

export type ActionStatutEditContext = ReturnType<
  typeof useActionStatutEditContext
>;

export function isActionStatutEditDisabled(
  ctx: ActionStatutEditContext,
  desactive: boolean
): boolean {
  const canUpdateResult = canUpdateActionStatutWithoutPermissionCheck({
    actions: [{ desactive }],
    parcoursStatus: ctx.parcoursStatus,
    isAuditeur: ctx.isAuditeur,
  });

  if (!canUpdateResult.canUpdate) {
    return true;
  }

  return !ctx.hasPermission;
}

/**
 * Détermine si l'utilisateur a le droit de modifier le statut d'une action.
 * @deprecated Use `useActionStatutEditContext` + `isActionStatutEditDisabled` instead
 * to avoid per-row hook overhead in tables.
 */
export const useEditActionStatutIsDisabled = (actionId: string) => {
  const ctx = useActionStatutEditContext();

  const action = useGetAction({ actionId });
  if (!action) {
    return true;
  }

  return isActionStatutEditDisabled(ctx, action.score.desactive);
};
