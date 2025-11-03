import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { Etoile, EtoileAsString, ReferentielId } from '@/domain/referentiels';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TLabellisationParcours } from './types';

export const useEnvoiDemande = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();
  const trpc = useTRPC();

  const { isPending, mutate: envoiDemande } = useMutation({
    mutationFn: async (args: {
      collectivite_id: number;
      referentiel: ReferentielId;
      etoiles: Etoile | null;
      sujet: 'labellisation' | 'cot' | 'labellisation_cot';
    }): Promise<boolean> => {
      const { collectivite_id, referentiel, etoiles, sujet } = args;
      if (!collectivite_id || !referentiel || !sujet) {
        return false;
      }

      const etoileDemandee = sujet === 'cot' || !etoiles ? null : etoiles;

      const { error } = await supabase.rpc('labellisation_submit_demande', {
        collectivite_id,
        referentiel,
        sujet,
        etoiles: etoileDemandee
          ? (etoileDemandee.toString() as EtoileAsString)
          : undefined,
      });
      if (error) {
        return false;
      }
      return true;
    },

    // avant que la mutation soit exécutée...
    onMutate: async ({ collectivite_id, referentiel }) => {
      // annule un éventuel fetch en cours pour que la MàJ optimiste ne soit pas écrasée
      const queryKey = ['labellisation_parcours', collectivite_id];
      await queryClient.cancelQueries({
        queryKey: queryKey,
      });

      // extrait la valeur actuelle du cache
      const previousCacheValue = queryClient.getQueryData(
        queryKey
      ) as TLabellisationParcours[];

      // crée la nouvelle valeur à partir des entrées
      const newValue = [...(previousCacheValue || [])];
      const index = newValue.findIndex((p) => p.referentiel === referentiel);
      if (index !== -1 && newValue[index].demande) {
        newValue[index].demande.en_cours = false;
      }

      // et écrit cette valeur dans le cache
      queryClient.setQueryData(queryKey, newValue);

      // Invalidate trpc as well
      queryClient.invalidateQueries({
        queryKey: trpc.referentiels.labellisations.getParcours.queryKey({
          collectiviteId: collectivite_id,
          referentielId: referentiel,
        }),
      });

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
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  return {
    isLoading: isPending,
    envoiDemande,
  };
};
