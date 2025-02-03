import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { TAudit } from '@/app/referentiels/audits/types';
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
