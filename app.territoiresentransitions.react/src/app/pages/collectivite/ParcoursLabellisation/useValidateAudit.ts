import { TAudit } from '@/app/app/pages/collectivite/Audit/types';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { useMutation, useQueryClient } from 'react-query';

export type TValidateAudit = ReturnType<typeof useValidateAudit>['mutate'];

/** Valider un audit */
export const useValidateAudit = () => {
  const queryClient = useQueryClient();

  return useMutation(validateAudit, {
    mutationKey: 'validateAudit',
    onSuccess: (data, variables) => {
      const { collectivite_id, referentiel } = variables;
      queryClient.invalidateQueries(
        ['audit', collectivite_id, referentiel],
        undefined,
        { cancelRefetch: true }
      );
      queryClient.invalidateQueries(
        ['labellisation_parcours', collectivite_id],
        undefined,
        { cancelRefetch: true }
      );
    },
  });
};

const validateAudit = async (audit: TAudit) =>
  supabaseClient.rpc('valider_audit', { audit_id: audit.id! });
