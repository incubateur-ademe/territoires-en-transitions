import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition, TIndicateurReferentielDefinition} from './types';
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
export const useIndicateursParentsGroup = (group: ReferentielOfIndicateur) => {
  // on affiche que les indicateurs parents sauf dans le cas CRTE
  const tous = useIndicateurDefinitions();
  const parents = useIndicateursParents();
  return (group === 'crte' ? tous : parents)?.filter(({programmes}) =>
    programmes.includes(group)
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
export const useIndicateursRemplis = () => {
  const collectivite_id = useCollectiviteId();
  const {data} = useQuery(['indicateur_rempli', collectivite_id], async () => {
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
        return {...acc, indicateursPerso: [...acc.indicateursPerso, perso_id]};
      }
      return acc;
    }, ID_INDICATEURS_REMPLIS);
  });

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

/** Fourni les id et libellés des thématiques associées aux indicateurs */
export const useIndicateurThematiquesLabels = () => {
  const {data} = useQuery(
    ['indicateur_thematique_nom'],
    async () => {
      const {data, error} = await supabaseClient
        .from('indicateur_thematique_nom')
        .select('*')
        .order('nom', {ascending: true});

      if (error) {
        throw new Error(error.message);
      }

      return (
        data
          ?.map(({id, nom}) => ({id, label: nom || ''}))
          // tri par nom (pour que les diacritiques soient pris en compte)
          .sort((a, b) => a.label.localeCompare(b.label))
      );
    },
    DISABLE_AUTO_REFETCH
  );
  return data || [];
};
