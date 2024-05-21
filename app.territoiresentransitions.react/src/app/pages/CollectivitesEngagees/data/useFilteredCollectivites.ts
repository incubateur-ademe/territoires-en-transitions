import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {NonNullableFields, Views, CollectiviteEngagee} from '@tet/api';
import {NB_CARDS_PER_PAGE} from 'app/pages/CollectivitesEngagees/data/utils';


/**
 * Element de la liste `collectivite_card`, utilisée par la vue toutes les
 * collectivités.
 */
export type TCollectiviteCarte = NonNullableFields<Views<'collectivite_card'>>;

// A subset of supabase FilterOperator as it not an exported type.
type FilterOperator = 'in' | 'ov';

/**
 * Renvoi une liste de collectivités en fonction d'un ensemble de filtres
 */
export const useFilteredCollectivites = (args: CollectiviteEngagee.Filters) => {
  const {data, isLoading} = useQuery(['collectivite_card', args], () =>
    fetchCollectiviteCards(args)
  );

  return {
    isLoading,
    collectivites: data?.collectivites || [],
    collectivitesCount: data?.collectivitesCount || 0,
  };
};

/**
 * Télécharge les collectivités en fonction des filtres.
 */
const fetchCollectiviteCards = async (filters: CollectiviteEngagee.Filters) => {
  // la requête
  const query = buildQueryFromFilters(filters);

  // attends les données
  const {error, data, count} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return {
    collectivites: (data as TCollectiviteCarte[]) || [],
    collectivitesCount: count ?? 0,
  };
};

/**
 * Construit la query en ajoutant des opérateurs Postgrest pour chaque filtre.
 */
const buildQueryFromFilters = (filters: CollectiviteEngagee.Filters) => {
  let query = supabaseClient
    .from('collectivite_card')
    .select('*', {count: 'exact'});

  const filter = (
    column: keyof TCollectiviteCarte,
    operator: FilterOperator,
    possibleValues: string[] | number[]
  ) => {
    const values = (possibleValues as string[])?.filter(
      (s: string) => s !== ''
    );
    if (values.length > 0) {
      switch (operator) {
        case 'in':
          query = query.in(column, values);
          break;
        case 'ov':
          query = query.overlaps(column, values);
          break;
      }
    }
  };

  filter('region_code', 'in', filters.regions);
  filter('departement_code', 'in', filters.departments);
  filter('type_collectivite', 'in', filters.typesCollectivite);
  filter('population_intervalle', 'in', filters.population);

  // Taux de remplissage
  if (filters.tauxDeRemplissage.length > 0) {
    if (filters.referentiel.length === 0) {
      filter('completude_intervalles', 'ov', filters.tauxDeRemplissage);
    } else {
      if (filters.referentiel.includes('cae'))
        filter('completude_cae_intervalle', 'in', filters.tauxDeRemplissage);

      if (filters.referentiel.includes('eci'))
        filter('completude_eci_intervalle', 'in', filters.tauxDeRemplissage);
    }
  }
  // en l'absence de taux ou de niveau de labellisation sélectionné, la
  // selection d'un référentiel équivaut à un taux de remplissage qui n'est pas 0
  else if (
    filters.referentiel.length > 0 &&
    filters.niveauDeLabellisation.length === 0
  ) {
    const intervalles = ['0-49', '50-79', '80-99', '100'];
    if (filters.referentiel.length === 1) {
      if (filters.referentiel.includes('cae'))
        filter('completude_cae_intervalle', 'in', intervalles);
      if (filters.referentiel.includes('eci'))
        filter('completude_eci_intervalle', 'in', intervalles);
    } else {
      filter('completude_intervalles', 'ov', intervalles);
    }
  }

  //  Niveau de labellisation
  if (filters.niveauDeLabellisation.length > 0) {
    if (filters.referentiel.length === 0) {
      filter('etoiles_all', 'ov', filters.niveauDeLabellisation);
    } else {
      if (filters.referentiel.includes('cae'))
        filter('etoiles_cae', 'in', filters.niveauDeLabellisation);
      if (filters.referentiel.includes('eci'))
        filter('etoiles_eci', 'in', filters.niveauDeLabellisation);
    }
  }

  //  Score
  if (filters.realiseCourant.length > 0) {
    if (filters.referentiel.length === 0) {
      filter('score_fait_max', 'ov', filters.realiseCourant);
    } else {
      if (filters.referentiel.includes('cae'))
        filter('score_fait_cae', 'in', filters.realiseCourant);
      if (filters.referentiel.includes('eci'))
        filter('score_fait_cae', 'in', filters.realiseCourant);
    }
  }

  // Nom
  if (filters.nom) {
    query = query.ilike('nom', `%${filters.nom}%`);
  }

  //  Trier par
  let orderBy: keyof TCollectiviteCarte;
  let ascending: boolean;
  switch (filters.trierPar?.[0]) {
    case 'nom':
      orderBy = 'nom';
      ascending = true;
      break;
    case 'completude':
      if (filters.referentiel.length !== 1) orderBy = 'completude_max';
      else
        orderBy =
          filters.referentiel[0] === 'eci'
            ? 'completude_eci'
            : 'completude_cae';
      ascending = false;
      break;
    case 'score':
    default:
      if (filters.referentiel.length !== 1) orderBy = 'score_fait_max';
      else
        orderBy =
          filters.referentiel[0] === 'eci'
            ? 'score_fait_eci'
            : 'score_fait_cae';
      ascending = false;
      break;
  }

  query = query.order(orderBy, {ascending: ascending});

  // Pagination
  if (filters.page) {
    query.range(
      NB_CARDS_PER_PAGE * (filters.page - 1),
      NB_CARDS_PER_PAGE * filters.page - 1
    );
  }
  query.limit(NB_CARDS_PER_PAGE);
  return query;
};
