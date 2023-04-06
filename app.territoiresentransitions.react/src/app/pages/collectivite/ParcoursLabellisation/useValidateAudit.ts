import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TAudit} from 'app/pages/collectivite/Audit/types';

export type TValidateAudit = ReturnType<typeof useValidateAudit>['mutate'];

/** Valider un audit */
export const useValidateAudit = () => {
  const queryClient = useQueryClient();

  return useMutation(validateAudit, {
    mutationKey: 'validateAudit',
    onSuccess: (data, variables) => {
      const {collectivite_id, referentiel} = variables;
      queryClient.invalidateQueries(
        ['audit', collectivite_id, referentiel],
        undefined,
        {cancelRefetch: true}
      );
      queryClient.invalidateQueries(
        ['labellisation_parcours', collectivite_id],
        undefined,
        {cancelRefetch: true}
      );
    },
  });
};

const validateAudit = async (audit: TAudit) =>
  supabaseClient.from('audit').update({valide: true}).eq('id', audit.id);
