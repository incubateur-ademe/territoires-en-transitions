import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { useMutation, useQueryClient } from 'react-query';
import { TActionAuditStatut } from './types';

// renvoie une fonction de modification du statut d'audit d'une action
export const useUpdateActionAuditStatut = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (actionAuditStatut: TActionAuditStatut) => {
      const { collectivite_id, action_id, ordre_du_jour, avis, statut } =
        actionAuditStatut;
      return supabaseClient.from('action_audit_state').insert({
        collectivite_id,
        action_id,
        ordre_du_jour,
        avis,
        statut,
      } as never);
    },
    {
      mutationKey: 'update_action_audit_state',
      // màj optimiste du cache
      onMutate: (variables: TActionAuditStatut) => {
        const queryKey = getQueryKey(variables);
        const previousValue = queryClient.getQueryData(queryKey);
        queryClient.setQueryData(queryKey, variables);
        return previousValue;
      },
      // recharge les données
      onSettled: (data, error, variables: TActionAuditStatut, context) => {
        const queryKey = getQueryKey(variables);
        // restaure l'état précédent du cache en cas d'erreur
        if (error) {
          queryClient.setQueryData(queryKey, context);
        }
        // et refetch pour être sûr que le cache est à jour
        queryClient.invalidateQueries(queryKey);
      },
    }
  );
};

const getQueryKey = (variables: TActionAuditStatut) => {
  const { collectivite_id, referentiel, action_id } = variables;
  return ['action_audit_state', collectivite_id, referentiel, action_id];
};
