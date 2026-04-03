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

export const useSaveActionStatuts = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.referentiels.actions.updateStatuts.mutationOptions({
      onSuccess: () => {
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

  const action = useGetAction({ actionId });
  if (!action) {
    return true;
  }

  const { score } = action;

  const canUpdateResult = canUpdateActionStatutWithoutPermissionCheck({
    actions: [{ desactive: score.desactive }],
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
