import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from './types';

/** Détermine si un indicateur est "à compléter" */
export const useIndicateurACompleter = (indicateurId: string | number) => {
  const {indicateurs, indicateursPerso} = useIndicateursRemplis();
  if (typeof indicateurId === 'string') {
    return !indicateurs.includes(indicateurId);
  }
  return !indicateursPerso.includes(indicateurId);
};

/** Fourni les définitions de tous les indicateurs "à compléter" */
export const useIndicateursNonRemplis = (
  definitions: TIndicateurDefinition[]
) => {
  const {indicateurs, indicateursPerso} = useIndicateursRemplis();
  return definitions?.filter(({id}) =>
    typeof id === 'string'
      ? !indicateurs.includes(id)
      : !indicateursPerso.includes(id)
  );
};

/** Fourni les identifiants des indicateurs qui ont au moins un résultat */
export const useIndicateursRemplis = (disableAutoRefetch?: boolean) => {
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(
    ['indicateur_rempli', collectivite_id],
    async () => {
      if (!collectivite_id) {
        return;
      }
      const {data, error} = await supabaseClient
        .from('indicateur_rempli')
        .select('indicateur_id,perso_id')
        .match({collectivite_id})
        .is('rempli', true);

      if (error) {
        throw new Error(error.message);
      }

      return data?.reduce((acc, {indicateur_id, perso_id}) => {
        if (indicateur_id !== null) {
          return {...acc, indicateurs: [...acc.indicateurs, indicateur_id]};
        }
        if (perso_id !== null) {
          return {
            ...acc,
            indicateursPerso: [...acc.indicateursPerso, perso_id],
          };
        }
        return acc;
      }, ID_INDICATEURS_REMPLIS);
    },
    disableAutoRefetch ? DISABLE_AUTO_REFETCH : undefined
  );

  return data || ID_INDICATEURS_REMPLIS;
};
type TIndicateursRemplis = {
  indicateurs: string[];
  indicateursPerso: number[];
};
const ID_INDICATEURS_REMPLIS: TIndicateursRemplis = {
  indicateurs: [],
  indicateursPerso: [],
};
