import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';

export type TStartAudit = ReturnType<typeof useStartAudit>['mutate'];

/** Démarrer un audit */
export const useStartAudit = () => {
  const queryClient = useQueryClient();

  return useMutation(startAudit, {
    mutationKey: 'startAudit',
    onSuccess: (data, variables) => {
      const {collectivite_id, referentiel} = variables;
      queryClient.invalidateQueries(['audit', collectivite_id, referentiel]);
      queryClient.invalidateQueries([
        'labellisation_parcours',
        collectivite_id,
      ]);
    },
  });
};

const startAudit = async ({
  audit_id,
}: {
  collectivite_id: number;
  referentiel: Database['public']['Enums']['referentiel'];
  audit_id: number;
}) =>
  supabaseClient.rpc('labellisation_commencer_audit', {audit_id} as {
    audit_id: number;
    date_debut: string;
  });
