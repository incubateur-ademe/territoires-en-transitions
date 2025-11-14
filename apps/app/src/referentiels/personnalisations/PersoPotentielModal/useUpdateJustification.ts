import { TablesInsert } from '@/api';
import { useSupabase } from '@/api';
import { TReponseRead } from '@/app/referentiels/personnalisations/personnalisation.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type TJustification = TablesInsert<'justification'>;

/**
 * Met à jour la justification d'une réponse à une question de personnalisation
 */
export const useUpdateJustification = () => {
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  return useMutation({
    mutationKey: ['upsert_referentiel_justification'],
    mutationFn: async (justification: TJustification) => {
      return supabase.from('justification').upsert(justification);
    },

    // mise à jour optimiste du cache
    onMutate: async ({ collectivite_id, question_id, texte }) => {
      const queryKey = ['reponse', collectivite_id, question_id];

      // annule un éventuel fetch en cours pour que la MàJ optimiste ne soit pas écrasée
      await queryClient.cancelQueries({
        queryKey: queryKey,
      });

      // extrait la valeur actuelle du cache
      const previousCacheValue: TReponseRead | undefined =
        queryClient.getQueryData(queryKey);

      // met à jour le cache
      queryClient.setQueryData(queryKey, {
        ...previousCacheValue,
        justification: texte,
      });
    },

    // rechargement après la requête
    onSettled: (data, err, variables: TJustification) => {
      const { collectivite_id } = variables;
      queryClient.invalidateQueries({
        queryKey: ['reponse', collectivite_id, variables.question_id],
      });
    },
  });
};
