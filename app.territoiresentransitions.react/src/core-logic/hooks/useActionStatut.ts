import {useMutation, useQuery, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCurrentCollectivite} from './useCurrentCollectivite';
import {useAudit, useIsAuditeur} from 'app/pages/collectivite/Audit/useAudit';
import {useActionScore} from './scoreHooks';
import {Database} from 'types/database.types';
import {useCollectiviteId} from './params';

/**
 * Charge le statut d'une action
 */
export const useActionStatut = (actionId: string) => {
  const collectivite_id = useCollectiviteId();
  const {data, isLoading} = useQuery(['action_statut', collectivite_id], () =>
    fetchCollectiviteActionStatuts(collectivite_id ?? undefined)
  );

  const statut = data?.find(action => action.action_id === actionId) || null;

  const filled =
    data?.find(
      action =>
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

const fetchCollectiviteActionStatuts = async (collectivite_id?: number) => {
  if (!collectivite_id) {
    return null;
  }
  const query = supabaseClient
    .from('action_statut')
    .select()
    .eq('collectivite_id', collectivite_id);
  const {error, data} = await query;

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
  const {isLoading, mutate: saveActionStatut} = useMutation(write, {
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

type TActionStatutWrite =
  Database['public']['Tables']['action_statut']['Insert'];
const write = async (statut: TActionStatutWrite) =>
  supabaseClient.from('action_statut').upsert([statut], {
    onConflict: 'collectivite_id,action_id',
  });

/**
 * Détermine si l'utilisateur a le droit de modifier le statut d'une action
 */
export const useEditActionStatutIsDisabled = (actionId: string) => {
  const collectivite = useCurrentCollectivite();
  const {data: audit} = useAudit();
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
