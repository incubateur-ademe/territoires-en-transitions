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
