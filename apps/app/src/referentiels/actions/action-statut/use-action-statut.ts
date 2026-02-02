import { useIsAuditeur } from '@/app/referentiels/audits/useAudit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DBClient, useSupabase, useTRPC } from '@tet/api';
import {
  useCollectiviteId,
  useCurrentCollectivite,
} from '@tet/api/collectivites';
import {
  StatutAvancement,
  canUpdateActionStatutWithoutPermissionCheck,
} from '@tet/domain/referentiels';
import { PermissionOperationEnum } from '@tet/domain/users';
import { objectToCamel } from 'ts-case-convert';
import { useLabellisationParcours } from '../../labellisations/useLabellisationParcours';
import { useReferentielId } from '../../referentiel-context';
import { useScore } from '../../use-snapshot';

/**
 * Charge le statut d'une action
 */
export const useActionStatut = (actionId: string) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const { data, isLoading } = useQuery({
    queryKey: ['action_statut', collectiviteId],
    queryFn: () =>
      collectiviteId
        ? fetchCollectiviteActionStatuts(supabase, collectiviteId)
        : null,
  });

  const statut = data?.find((action) => action.actionId === actionId) || null;

  const filled =
    data?.find(
      (action) =>
        action.actionId.includes(actionId) &&
        action.actionId.split(actionId)[1] !== '' &&
        action.avancement !== 'non_renseigne'
    ) !== undefined || null;

  return {
    statut,
    filled,
    isLoading,
  };
};

async function fetchCollectiviteActionStatuts(
  supabase: DBClient,
  collectiviteId: number
) {
  const query = supabase
    .from('action_statut')
    .select()
    .eq('collectivite_id', collectiviteId);

  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return objectToCamel(data);
}

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

export const useTasksStatus = (tasksIds: string[]) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  const { data, isLoading } = useQuery({
    queryKey: ['action_statut', collectiviteId],
    queryFn: () =>
      collectiviteId
        ? fetchCollectiviteActionStatuts(supabase, collectiviteId)
        : null,
  });

  let tasksStatus: {
    [key: string]: { avancement: StatutAvancement; concerne: boolean };
  } = {};

  tasksIds.forEach((taskId) => {
    const task = data?.find((action) => action.actionId === taskId);
    if (task !== undefined)
      tasksStatus = {
        ...tasksStatus,
        [taskId]: { avancement: task.avancement, concerne: task.concerne },
      };
  });

  return { tasksStatus, isLoading };
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
