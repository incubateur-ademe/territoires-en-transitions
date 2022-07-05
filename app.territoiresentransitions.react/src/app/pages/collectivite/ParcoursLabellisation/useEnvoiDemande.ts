import {useMutation, useQueryClient} from 'react-query';
import {submitDemande} from './queries';

export const useEnvoiDemande = () => {
  const queryClient = useQueryClient();
  const {isLoading, mutate: envoiDemande} = useMutation(submitDemande, {
    onSuccess: (_, {collectivite_id, referentiel, etoiles}) => {
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
