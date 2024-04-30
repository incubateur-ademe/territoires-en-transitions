import {useHistory} from 'react-router-dom';
import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
// import {useFonctionTracker} from 'core-logic/hooks/useFonctionTracker';
import {makeCollectiviteIndicateursUrl} from 'app/paths';

export const useRemoveIndicateurPerso = (
  collectivite_id: number | undefined,
  indicateur_id: number
) => {
  //  const tracker = useFonctionTracker();
  const history = useHistory();
  const queryClient = useQueryClient();

  return useMutation(['remove_indicateur_perso', indicateur_id], async () => {
    if (!collectivite_id || !indicateur_id) return;

    // TODO: remplacer cet appel qui ne fonctionne pas par une RPC
    const {error} = await supabaseClient
      .from('indicateur_personnalise_definition')
      .delete()
      .match({collectivite_id, id: indicateur_id});

    if (!error) {
      queryClient.invalidateQueries([
        'indicateur_definitions',
        collectivite_id,
        'perso',
      ]);

      history.push(
        makeCollectiviteIndicateursUrl({
          collectiviteId: collectivite_id,
          indicateurView: 'perso',
        })
      );
    } else {
      console.error(error);
    }
  });
};
