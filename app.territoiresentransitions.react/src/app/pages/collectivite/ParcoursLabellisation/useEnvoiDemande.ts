import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {LabellisationParcoursRead} from 'generated/dataLayer/labellisation_parcours_read';
import {Database} from 'types/database.types';

export const useEnvoiDemande = () => {
  const queryClient = useQueryClient();
  const {isLoading, mutate: envoiDemande} = useMutation(submitDemande, {
    mutationKey: 'submit_demande',
    onSuccess: (
      _,
      {
        collectivite_id,
        referentiel,
        etoiles,
      }: LabellisationParcoursRead['demande']
    ) => {
      queryClient.invalidateQueries([
        'labellisation_demande',
        collectivite_id,
        referentiel,
        etoiles,
      ]);
    },
  });

  return {
    isLoading,
    envoiDemande,
  };
};

// soumet une demande de labellisation
export const submitDemande = async (args: {
  collectivite_id: number;
  etoiles?: '1' | '2' | '3' | '4' | '5';
  referentiel: Database['public']['Enums']['referentiel'];
  sujet: 'labellisation' | 'labellisation_cot' | 'cot';
}): Promise<boolean> => {
  const {collectivite_id, referentiel, etoiles, sujet} = args;
  if (!collectivite_id || !referentiel || !sujet) {
    return false;
  }
  const {error} = await supabaseClient.rpc('labellisation_submit_demande', {
    collectivite_id,
    referentiel,
    sujet,
    etoiles: sujet === 'cot' ? null : etoiles,
  });
  if (error) {
    return false;
  }
  return true;
};
