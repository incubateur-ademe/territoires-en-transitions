import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';

export const useIndicateursPersoDefinitions = (collectivite_id: number) =>
  useQuery(
    ['indicateur_personnalise_definition', collectivite_id],
    async () => {
      const {data} = await supabaseClient
        .from('indicateur_personnalise_definition')
        .select()
        .match({collectivite_id})
        .order('titre', {ascending: true});

      // TODO: décommenter la ligne suivante si le order ne fonctionne pas avec les accents...
      // return data?.sort((a, b) => a.titre.localeCompare(b.titre));
      return data as TIndicateurPersoDefinition[];
    }
  );

// TODO: corriger le typage côté back ?
// collectivite_id: number | null => ne devrait pas pouvoir être `null` ?
export type TIndicateurPersoDefinition =
  Database['public']['Tables']['indicateur_personnalise_definition']['Row'] & {
    collectivite_id: number;
  };
