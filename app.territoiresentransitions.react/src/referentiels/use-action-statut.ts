import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useAudit, useIsAuditeur } from '@/app/referentiels/audits/useAudit';
// import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  ActionStatutInsert,
  getReferentielIdFromActionId,
  StatutAvancement,
} from '@/domain/referentiels';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { omit } from 'es-toolkit';
import { objectToCamel, objectToSnake } from 'ts-case-convert';
import { useCollectiviteId } from '../core-logic/hooks/params';
import { useCurrentCollectivite } from '../core-logic/hooks/useCurrentCollectivite';
import { useActionScore } from './DEPRECATED_score-hooks';
import {
  useScore,
  useSnapshotComputeAndUpdate,
  useSnapshotFlagEnabled,
} from './use-snapshot';

/**
 * Charge le statut d'une action
 */
export const useActionStatut = (actionId: string) => {
  const collectiviteId = useCollectiviteId();

  const { data, isLoading } = useQuery({
    queryKey: ['action_statut', collectiviteId],
    queryFn: () =>
      collectiviteId ? fetchCollectiviteActionStatuts(collectiviteId) : null,
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

async function fetchCollectiviteActionStatuts(collectiviteId: number) {
  const query = supabaseClient
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
  const collectiviteId = useCollectiviteId()!;
  const queryClient = useQueryClient();

  const { computeScoreAndUpdateCurrentSnapshot } =
    useSnapshotComputeAndUpdate();

  const { isPending, mutate: saveActionStatut } = useMutation({
    mutationFn: async (statut: ActionStatutInsert) => {
      return supabaseClient
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
    isLoading: isPending,
    saveActionStatut,
  };
};

export const useTasksStatus = (tasksIds: string[]) => {
  const collectiviteId = useCollectiviteId();

  const { data, isLoading } = useQuery({
    queryKey: ['action_statut', collectiviteId],
    queryFn: () =>
      collectiviteId ? fetchCollectiviteActionStatuts(collectiviteId) : null,
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

  const DEPRECATED_score = useActionScore(actionId);
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  const NEW_score = useScore(actionId);

  if (FLAG_isSnapshotEnabled) {
    return Boolean(
      !collectivite ||
        collectivite.isReadOnly ||
        !NEW_score ||
        NEW_score.desactive ||
        (audit && (!isAuditeur || audit.valide))
    );
  } else {
    return Boolean(
      !collectivite ||
        collectivite.isReadOnly ||
        !DEPRECATED_score ||
        DEPRECATED_score.desactive ||
        (audit && (!isAuditeur || audit.valide))
    );
  }
};
