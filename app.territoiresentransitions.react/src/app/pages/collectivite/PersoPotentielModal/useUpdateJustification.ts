import { TablesInsert } from '@/api';
import { supabaseClient } from '@/app/core-logic/api/supabase';
import { TReponseRead } from '@/app/referentiels/personnalisations/personnalisation.types';
import { useMutation, useQueryClient } from 'react-query';

type TJustification = TablesInsert<'justification'>;

/**
 * Met à jour la justification d'une réponse à une question de personnalisation
 */
export const useUpdateJustification = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async (justification: TJustification) => {
      return supabaseClient.from('justification').upsert(justification);
    },
    {
      mutationKey: 'update_justification',

      // mise à jour optimiste du cache
      onMutate: async ({ collectivite_id, question_id, texte }) => {
        const queryKey = ['reponse', collectivite_id, question_id];

        // annule un éventuel fetch en cours pour que la MàJ optimiste ne soit pas écrasée
        await queryClient.cancelQueries(queryKey);

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
        queryClient.invalidateQueries([
          'reponse',
          collectivite_id,
          variables.question_id,
        ]);
      },
    }
  );
};
