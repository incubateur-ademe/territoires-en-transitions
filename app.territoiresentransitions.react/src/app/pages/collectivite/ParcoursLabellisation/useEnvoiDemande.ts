import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';

export const useEnvoiDemande = () => {
  const queryClient = useQueryClient();
  const {isLoading, mutate: envoiDemande} = useMutation(submitDemande, {
    mutationKey: 'submit_demande',
    onSuccess: (
      _,
      {collectivite_id, referentiel, etoiles}: TLabellisationSubmitDemande
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

// surcharge le type exporté des arguments de `labellisation_submit_demande` pour
// rendre le champ `etoiles` nullable (cas audit cot SANS labellisation)
type TLabellisationSubmitDemandeArgs =
  Database['public']['Functions']['labellisation_submit_demande']['Args'];
type TLabellisationSubmitDemande = Omit<
  TLabellisationSubmitDemandeArgs,
  'etoiles'
> & {
  etoiles: TLabellisationSubmitDemandeArgs['etoiles'] | null;
};

// soumet une demande de labellisation
export const submitDemande = async (
  args: TLabellisationSubmitDemande
): Promise<boolean> => {
  const {collectivite_id, referentiel, etoiles, sujet} = args;
  if (!collectivite_id || !referentiel || !sujet) {
    return false;
  }

  const etoileDemandee = sujet === 'cot' || !etoiles ? null : etoiles;

  const {error} = await supabaseClient.rpc('labellisation_submit_demande', {
    collectivite_id,
    referentiel,
    sujet,
    etoiles: etoileDemandee,
  } as TLabellisationSubmitDemandeArgs);
  if (error) {
    return false;
  }
  return true;
};
