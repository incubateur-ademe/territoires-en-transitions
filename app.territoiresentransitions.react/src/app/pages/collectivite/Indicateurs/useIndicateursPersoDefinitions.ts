import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TIndicateurPersoDefinition} from './types';
import {useCollectiviteId} from 'core-logic/hooks/params';

/** Fourni les définitions de tous les indicateurs personnalisés */
export const useIndicateursPersoDefinitions = (collectivite_id: number) => {
  const {data} = useQuery(
    ['indicateur_personnalise_definition', collectivite_id],
    async () => {
      const {data} = await supabaseClient
        .from('indicateur_personnalise_definition')
        .select()
        .match({collectivite_id})
        .order('titre', {ascending: true});

      return (
        (data?.map(definition => ({
          ...definition,
          isPerso: true,
        })) as TIndicateurPersoDefinition[]) || []
      );
    }
  );
  return data;
};

/** Fourni la définition d'un indicateur personnalisé à partir de son id */
export const useIndicateurPersoDefinition = (id: number) => {
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(
    ['indicateur_personnalise_definition', collectivite_id, id],
    async () => {
      if (!collectivite_id) {
        return;
      }

      const {data} = await supabaseClient
        .from('indicateur_personnalise_definition')
        .select()
        .match({collectivite_id, id});

      const definition = data?.[0];
      return {...definition, isPerso: true} as TIndicateurPersoDefinition;
    }
  );
  return data;
};
