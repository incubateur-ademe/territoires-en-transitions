import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {Database} from 'types/database.types';

export type TIndicateurDefinition =
  Database['public']['Tables']['indicateur_definition']['Row'];

// charge et cache les définitions de tous les indicateurs
export const useAllIndicateurDefinitions = () => {
  const {data} = useQuery(
    ['indicateur_definition'],
    fetchAllIndicateurDefinitions,
    DISABLE_AUTO_REFETCH
  );
  return data || [];
};

// charge les définitions de tous les indicateurs
const fetchAllIndicateurDefinitions = async () => {
  const {data, error} = await supabaseClient
    .from('indicateur_definition')
    .select()
    .order('identifiant', {ascending: true});
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

// une variante qui filtre par groupe d'indicateurs et tri par identifiant
export const useAllIndicateurDefinitionsForGroup = (
  group: 'eci' | 'crte' | 'cae'
) => {
  const {data} = useQuery(
    ['indicateur_definition', group],
    async () => {
      const indicateurs = await fetchAllIndicateurDefinitions();
      return sortIndicateurDefinitionsByIdentifiant(
        indicateurs?.filter(({indicateur_group}) => indicateur_group === group)
      );
    },
    DISABLE_AUTO_REFETCH
  );
  return data || [];
};

// tri les indicateurs par identifiant
export const sortIndicateurDefinitionsByIdentifiant = (
  definitions: TIndicateurDefinition[]
): TIndicateurDefinition[] =>
  definitions.sort((def_a, def_b) => {
    const identifiant_a = def_a.identifiant;
    const identifiant_b = def_b.identifiant;
    const a_groups = identifiant_a.match(indicateurIdentifiantRegexp)?.groups;
    const b_groups = identifiant_b.match(indicateurIdentifiantRegexp)?.groups;
    if (!a_groups || !b_groups)
      return identifiant_a.localeCompare(identifiant_b);
    const a_number = Number(a_groups['number']);
    const b_number = Number(b_groups['number']);

    if (a_number !== b_number) {
      return a_number > b_number ? 1 : -1;
    }

    return (a_groups['literal'] ?? '').localeCompare(b_groups['literal'] ?? '');
  });

const indicateurIdentifiantRegexp = '(?<number>[0-9]{1,3})(?<literal>.+)?';
