import { DBClient } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useAudit, useIsAuditeur } from '@/app/referentiels/audits/useAudit';
import {
  ActionStatutInsert,
  StatutAvancement,
  getReferentielIdFromActionId,
} from '@/domain/referentiels';
import { omit } from 'es-toolkit';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { objectToCamel, objectToSnake } from 'ts-case-convert';
import { useCurrentCollectivite } from '../../../core-logic/hooks/useCurrentCollectivite';
import { useScore, useSnapshotComputeAndUpdate } from '../../use-snapshot';

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
// TODO-SNAPSHOT
export const useSaveActionStatut = () => {
  const collectiviteId = useCollectiviteId();
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  const { computeScoreAndUpdateCurrentSnapshot } =
    useSnapshotComputeAndUpdate();

  const { isLoading, mutate: saveActionStatut } = useMutation({
    mutationFn: async (statut: ActionStatutInsert) => {
      return supabase
        .from('action_statut')
        .upsert([objectToSnake(omit(statut, ['modifiedAt', 'modifiedBy']))], {
          onConflict: 'collectivite_id,action_id',
        });
    },
    onSuccess: (_, statut) => {
      // Invalidate cache for all action statuts
      queryClient.invalidateQueries({
        queryKey: ['action_statut', collectiviteId],
      });

      computeScoreAndUpdateCurrentSnapshot({
        collectiviteId,
        referentielId: getReferentielIdFromActionId(statut.actionId),
      });
    },
  });

  return {
    isLoading,
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
  const collectivite = useCurrentCollectivite();
  const { data: audit } = useAudit();
  const isAuditeur = useIsAuditeur();

  const score = useScore(actionId);

  return Boolean(
    !collectivite ||
      collectivite.isReadOnly ||
      !score ||
      score.desactive ||
      (audit && (!isAuditeur || audit.valide))
  );
};
