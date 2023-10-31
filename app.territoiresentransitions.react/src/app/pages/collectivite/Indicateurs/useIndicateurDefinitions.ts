import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {TIndicateurReferentielDefinition} from './types';
import {ReferentielOfIndicateur} from 'types/litterals';

/** Charge et cache les définitions de tous les indicateurs */
export const useIndicateurDefinitions = () => {
  const {data} = useQuery(
    ['indicateur_definition'],
    async () => {
      const {data, error} = await supabaseClient
        .from('indicateur_definition')
        .select('*, action_ids: indicateur_action (action_id)')
        .order('nom', {ascending: true});

      if (error) {
        throw new Error(error.message);
      }

      return (
        data
          // tri par nom (pour que les diacritiques soient pris en compte)
          ?.sort((a, b) => a.nom.localeCompare(b.nom))
          // enrichie la définition avec...
          .map((definition, index, tous) => {
            const {action_ids, id} = definition;

            // - les liens sur les définitions enfants
            const enfants = tous?.filter(d => d.parent === id);

            // - les ids des actions liées aux indicateurs
            const actions =
              (Array.isArray(action_ids) &&
                action_ids?.length &&
                action_ids.map(a => a.action_id)) ||
              null;

            return {...definition, actions, enfants};
          }) as unknown as TIndicateurReferentielDefinition[]
      );
    },
    DISABLE_AUTO_REFETCH
  );
  return data || [];
};

/** Fourni les définitions des indicateurs "parents" */
export const useIndicateursParents = () =>
  useIndicateurDefinitions()?.filter(({parent}) => parent === null);

/** Fourni les définitions des indicateurs par groupe d'indicateurs prédéfinis */
export const useIndicateursParentsGroup = (group: string) => {
  // on affiche que les indicateurs parents sauf dans le cas CRTE
  const tous = useIndicateurDefinitions();
  const parents = useIndicateursParents();
  if (!['cae', 'eci', 'crte'].includes(group)) return [];
  return (group === 'crte' ? tous : parents)?.filter(({programmes}) =>
    programmes.includes(group as ReferentielOfIndicateur)
  );
};

/** Fourni les définitions des indicateurs clés */
export const useIndicateursParentsCles = () =>
  useIndicateursParents()?.filter(({programmes}) =>
    programmes?.includes('clef')
  );

/** Fourni les définitions des indicateurs pour la page "Sélection" */
export const useIndicateursParentsSelection = () =>
  useIndicateursParents()?.filter(({selection}) => selection);

/** Fourni les définitions des indicateurs liés à une action du référentiel */
export const useIndicateursAction = (actionId: string) =>
  useIndicateurDefinitions()?.filter(({actions}) =>
    actions?.includes(actionId)
  );

/** Fourni la définition d'un indicateur à partir de son id */
export const useIndicateur = (indicateurId: string) =>
  useIndicateurDefinitions()?.find(({id}) => id === indicateurId);
