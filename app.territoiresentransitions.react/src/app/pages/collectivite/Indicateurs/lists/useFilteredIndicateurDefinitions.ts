import {useQuery} from 'react-query';
import {Indicateurs} from '@tet/api';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {IndicateurViewParamOption} from 'app/paths';

export type Filters = Indicateurs.Filters;

/**
 * Charge la liste d'indicateurs en fonction du filtre donné
 *
 * @param filter Paramètres de filtrage
 */
export const useFilteredIndicateurDefinitions = (
  view: IndicateurViewParamOption,
  filter: Filters
) => {
  const collectivite_id = useCollectiviteId();

  return useQuery(
    ['indicateur_definitions', collectivite_id, view, filter],
    async () => {
      if (!collectivite_id) return [];
      const {data, error} = await Indicateurs.fetchFilteredIndicateurs(
        supabaseClient,
        collectivite_id,
        view,
        filter
      );

      if (error) {
        throw new Error(error.message);
      }

      return (
        data
          // tri par nom (pour que les diacritiques soient pris en compte)
          ?.sort((a, b) => (a.nom && b.nom ? a.nom.localeCompare(b.nom) : 0))
      );
    },
    DISABLE_AUTO_REFETCH
  );
};
