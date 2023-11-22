import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  INDICATEUR_PERSO_COLS,
  INDICATEUR_PREDEFINI_COLS,
  TIndicateurPersonnalise,
  TIndicateurPredefini,
} from './types';

/** Charge la définition détaillée d'un indicateur */
export const useIndicateurPredefini = (indicateur_id: string) => {
  const collectivite_id = useCollectiviteId();

  const {data} = useQuery(
    ['indicateur_definition', collectivite_id, indicateur_id],
    async () => {
      if (!collectivite_id) return;

      const cols = INDICATEUR_PREDEFINI_COLS.join(',');

      const {data, error} = await supabaseClient
        .from('indicateur_definitions')
        .select(
          `...definition_referentiel(${cols}), rempli, enfants(...definition_referentiel(${cols},parent), rempli), thematiques(id, nom), action_ids`
        )
        .match({collectivite_id, indicateur_id})
        .returns<TIndicateurPredefini[]>();

      if (error) {
        throw new Error(error.message);
      }

      return data?.[0];
    },
    DISABLE_AUTO_REFETCH
  );
  return data;
};

/** Charge la définition détaillée d'un indicateur personnalisé */
export const useIndicateurPersonnalise = (indicateur_id: number) => {
  const collectivite_id = useCollectiviteId();

  return useQuery(
    ['indicateur_definition', collectivite_id, indicateur_id],
    async () => {
      if (!collectivite_id) return;

      const cols = INDICATEUR_PERSO_COLS.join(',');
      const {data, error} = await supabaseClient
        .from('indicateur_definitions')
        .select(`...definition_perso(${cols}), rempli, thematiques(id, nom)`)
        .match({collectivite_id, indicateur_perso_id: indicateur_id})
        .returns<TIndicateurPersonnalise[]>();

      if (error) {
        throw new Error(error.message);
      }

      return {...data?.[0], nom: data?.[0]?.titre, isPerso: true};
    },
    DISABLE_AUTO_REFETCH
  );
};
