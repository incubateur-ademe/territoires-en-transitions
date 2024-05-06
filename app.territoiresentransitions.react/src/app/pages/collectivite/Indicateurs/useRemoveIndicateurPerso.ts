import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';
import {useHistory} from 'react-router-dom';
// import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {useEventTracker} from '@tet/ui';
import {makeCollectiviteIndicateursUrl} from 'app/paths';

export const useDeleteIndicateurPerso = (
  collectivite_id: number,
  indicateur_id: number
) => {
  const tracker = useEventTracker('app/indicateurs/perso');
  const history = useHistory();
  const queryClient = useQueryClient();

  return useMutation(
    ['delete_indicateur_perso', indicateur_id],
    async () => {
      if (collectivite_id === undefined || indicateur_id === undefined) {
        return;
      }

      const {error} = await supabaseClient
        .from('indicateur_personnalise_definition')
        .delete()
        .match({collectivite_id, id: indicateur_id});

      if (error) {
        console.error(error);
        throw error;
      }

      queryClient.invalidateQueries([
        'indicateur_definitions',
        collectivite_id,
        'perso',
      ]);
    },

    {
      meta: {
        success: "L'indicateur personnalisé a été supprimé",
        error: "L'indicateur personnalisé n'a pas pu être supprimé",
      },
      onSuccess: () => {
        history.push(
          makeCollectiviteIndicateursUrl({
            collectiviteId: collectivite_id,
            indicateurView: 'perso',
          })
        );

        tracker('indicateur_suppression', {collectivite_id, indicateur_id});
      },
    }
  );
};
