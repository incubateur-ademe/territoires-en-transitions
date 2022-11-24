import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';
import {TActionAuditStatut} from './types';

// renvoie une fonction de modification du statut d'audit d'une action
export const useUpdateActionAuditStatut = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (actionAuditStatut: TActionAuditStatut) => {
      const {collectivite_id, action_id, ordre_du_jour, avis, statut} =
        actionAuditStatut;
      return supabaseClient
        .from('action_audit_state')
        .insert({
          collectivite_id,
          action_id,
          ordre_du_jour,
          avis,
          statut,
        } as never);
    },
    {
      mutationKey: 'update_action_audit_state',
      onSuccess: (data: unknown, variables: TActionAuditStatut) => {
        const {collectivite_id, referentiel} = variables;
        queryClient.invalidateQueries([
          'action_audit_state',
          collectivite_id,
          referentiel,
        ]);
      },
    }
  );
};
