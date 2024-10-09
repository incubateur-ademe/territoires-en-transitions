import { ficheResumesFetch } from '@tet/api/plan-actions';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useQuery } from 'react-query';

// charge les fiches actions liées à une action du référentiel
export const useFichesActionLiees = (actionId: string) => {
  const collectiviteId = useCollectiviteId();

  // charge les fiches action liées à une action
  const { data, isLoading } = useQuery(
    ['fiche_action_liees', collectiviteId, actionId],
    async () => {
      if (!collectiviteId) {
        throw new Error('Aucune collectivité associée');
      }

      return ficheResumesFetch({
        dbClient: supabaseClient,
        collectiviteId,
        options: {
          filtre: {
            referentielActionIds: [actionId],
          },
        },
      });
    }
  );

  // chargement encore en cours ou pas de données
  if (isLoading || !data) {
    return { data: [], isLoading };
  }

  // dédoublonne les fiches liées à plusieurs sous-actions de la même action
  const fichesDedoublonnees = data.data?.filter(
    (fiche, i, a) => a.findIndex((v) => v.id === fiche.id) === i
  );

  // renvoie les données
  return {
    isLoading: false,
    data: fichesDedoublonnees ?? [],
  };
};
