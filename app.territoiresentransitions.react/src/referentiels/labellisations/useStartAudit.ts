import { Enums } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useMutation, useQueryClient } from 'react-query';

export type TStartAudit = ReturnType<typeof useStartAudit>['mutate'];

/** Démarrer un audit */
export const useStartAudit = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation(
    async ({
      audit_id,
    }: {
      collectivite_id: number;
      referentiel: Enums<'referentiel'>;
      audit_id: number;
    }) =>
      supabase.rpc('labellisation_commencer_audit', { audit_id } as {
        audit_id: number;
        date_debut: string;
      }),
    {
      mutationKey: 'startAudit',
      onSuccess: (data, variables) => {
        const { collectivite_id, referentiel } = variables;
        queryClient.invalidateQueries(['audit', collectivite_id, referentiel]);
        queryClient.invalidateQueries([
          'peut_commencer_audit',
          collectivite_id,
          referentiel,
        ]);
        queryClient.invalidateQueries([
          'labellisation_parcours',
          collectivite_id,
        ]);
      },
    }
  );
};
