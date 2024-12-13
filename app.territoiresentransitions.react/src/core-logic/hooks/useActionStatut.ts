import { TablesInsert } from '@/api';
import {
  useAudit,
  useIsAuditeur,
} from '@/app/app/pages/collectivite/Audit/useAudit';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { TActionAvancement } from '@/app/types/alias';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useCollectiviteId } from './params';
import { useActionScore } from './scoreHooks';
import { useCurrentCollectivite } from './useCurrentCollectivite';

/**
 * Charge le statut d'une action
 */
export const useActionStatut = (actionId: string) => {
  const collectivite_id = useCollectiviteId();
  const { data, isLoading } = useQuery(['action_statut', collectivite_id], () =>
    fetchCollectiviteActionStatuts(collectivite_id ?? undefined)
  );

  const statut = data?.find((action) => action.action_id === actionId) || null;

  const filled =
    data?.find(
      (action) =>
        action.action_id.includes(actionId) &&
        action.action_id.split(actionId)[1] !== '' &&
        action.avancement !== 'non_renseigne'
    ) !== undefined || null;

  return {
    statut,
    filled,
    isLoading,
  };
};

export const useTasksStatus = (tasksIds: string[]) => {
  const collectivite_id = useCollectiviteId();
  const { data, isLoading } = useQuery(['action_statut', collectivite_id], () =>
    fetchCollectiviteActionStatuts(collectivite_id ?? undefined)
  );

  let tasksStatus: {
    [key: string]: { avancement: TActionAvancement; concerne: boolean };
  } = {};

  tasksIds.forEach((taskId) => {
    const task = data?.find((action) => action.action_id === taskId);
    if (task !== undefined)
      tasksStatus = {
        ...tasksStatus,
        [taskId]: { avancement: task.avancement, concerne: task.concerne },
      };
  });

  return { tasksStatus, isLoading };
};

const fetchCollectiviteActionStatuts = async (collectivite_id?: number) => {
  if (!collectivite_id) {
    return null;
  }
  const query = supabaseClient
    .from('action_statut')
    .select()
    .eq('collectivite_id', collectivite_id);
  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

/**
 * Met à jour le statut d'une action
 */
export const useSaveActionStatut = () => {
  const collectivite_id = useCollectiviteId();
  const queryClient = useQueryClient();
  const { isLoading, mutate: saveActionStatut } = useMutation(write, {
    mutationKey: 'action_statut',
    onSuccess: () => {
      queryClient.invalidateQueries(['action_statut', collectivite_id]);
    },
  });

  return {
    isLoading,
    saveActionStatut,
  };
};

type TActionStatutWrite = TablesInsert<'action_statut'>;
const write = async (statut: TActionStatutWrite) => {
  delete statut.modified_at;
  delete statut.modified_by;
  return supabaseClient.from('action_statut').upsert([statut], {
    onConflict: 'collectivite_id,action_id',
  });
};

/**
 * Détermine si l'utilisateur a le droit de modifier le statut d'une action
 */
export const useEditActionStatutIsDisabled = (actionId: string) => {
  const collectivite = useCurrentCollectivite();
  const { data: audit } = useAudit();
  const isAuditeur = useIsAuditeur();
  const score = useActionScore(actionId);

  return Boolean(
    !collectivite ||
      collectivite.readonly ||
      !score ||
      score.desactive ||
      (audit && (!isAuditeur || audit.valide))
  );
};
