import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  INDICATEUR_PERSO_COLS,
  INDICATEUR_PREDEFINI_COLS,
  TIndicateurPersonnalise,
  TIndicateurPredefini,
  TIndicateurPredefiniEnfant,
} from './types';

// type des données lues depuis le back avant transformation
type TIndicateurPredefiniRead = Omit<
  TIndicateurPredefini,
  'action_ids' | 'enfants'
> & {
  indicateur_action: {action_id: string}[];
  enfants: (TIndicateurPredefiniRead & {parent: string})[] | undefined;
};

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
          `...definition_referentiel(${cols}, indicateur_action(action_id)), rempli, enfants(...definition_referentiel(${cols},parent, indicateur_action(action_id)), rempli), thematiques(id, nom)`
        )
        .match({collectivite_id, indicateur_id})
        .returns<TIndicateurPredefiniRead[]>();

      if (error) {
        throw new Error(error.message);
      }

      return transform(data?.[0]);
    },
    DISABLE_AUTO_REFETCH
  );
  return data;
};

// transforme le tableau `indicateur_action` en  `action_ids`
// sur la définition principale et les éventuelles définitions enfants
const transform = (
  definition: TIndicateurPredefiniRead
): TIndicateurPredefini => {
  const {indicateur_action, enfants, ...unchanged} = definition;

  return {
    ...unchanged,
    action_ids: indicateur_action.map(a => a.action_id),
    enfants: enfants?.map(e => transform(e) as TIndicateurPredefiniEnfant),
  };
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
