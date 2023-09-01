import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from './types';

/** Détermine si un indicateur est "à compléter" */
export const useIndicateurACompleter = (indicateurId: string | number) => {
  const indicateursRemplis = useIndicateursRemplis();
  return !indicateursRemplis?.includes(indicateurId);
};

/** Fourni les définitions de tous les indicateurs "à compléter" */
export const useIndicateursNonRemplis = (
  definitions: TIndicateurDefinition[]
) => {
  const indicateursRemplis = useIndicateursRemplis();
  return definitions?.filter(({id}) => !indicateursRemplis?.includes(id));
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

      return data
        ?.map(({indicateur_id, perso_id}) => indicateur_id || perso_id)
        .filter(id => id !== null) as (string | number)[];
    },
    disableAutoRefetch ? DISABLE_AUTO_REFETCH : undefined
  );

  return data;
};
