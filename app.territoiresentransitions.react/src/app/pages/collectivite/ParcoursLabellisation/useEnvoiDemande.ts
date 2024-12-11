import { Database } from '@/api';
import { supabaseClient } from 'core-logic/api/supabase';
import { useMutation, useQueryClient } from 'react-query';
import { TLabellisationParcours } from './types';

export const useEnvoiDemande = () => {
  const queryClient = useQueryClient();
  const { isLoading, mutate: envoiDemande } = useMutation(submitDemande, {
    mutationKey: 'submit_demande',
    // avant que la mutation soit exécutée...
    onMutate: async ({ collectivite_id, referentiel }) => {
      // annule un éventuel fetch en cours pour que la MàJ optimiste ne soit pas écrasée
      const queryKey = ['labellisation_parcours', collectivite_id];
      await queryClient.cancelQueries(queryKey);

      // extrait la valeur actuelle du cache
      const previousCacheValue = queryClient.getQueryData(
        queryKey
      ) as TLabellisationParcours[];

      // crée la nouvelle valeur à partir des entrées
      const newValue = [...previousCacheValue];
      const index = newValue.findIndex((p) => p.referentiel === referentiel);
      if (index !== -1) {
        newValue[index].demande!.en_cours = false;
      }

      // et écrit cette valeur dans le cache
      queryClient.setQueryData(queryKey, newValue);

      // renvoi un objet `context` avec la valeur précédente du cache et la
      // clé correspondante
      return { queryKey, previousCacheValue };
    },
    // utilise le contexte fourni par `onMutate` pour revenir à l'état
    // précédent si la mutation a échouée
    onError: (err, variables, context) => {
      if (context) {
        const { queryKey, previousCacheValue } = context;
        queryClient.setQueryData(queryKey, previousCacheValue);
      }
    },
    // et refetch systématiquement que la mutation se soit bien effectuée ou
    // non
    onSettled: (data, error, variables, context) => {
      if (context) {
        queryClient.invalidateQueries(context.queryKey);
      }
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
  const { collectivite_id, referentiel, etoiles, sujet } = args;
  if (!collectivite_id || !referentiel || !sujet) {
    return false;
  }

  const etoileDemandee = sujet === 'cot' || !etoiles ? null : etoiles;

  const { error } = await supabaseClient.rpc('labellisation_submit_demande', {
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
