import {supabaseClient} from 'core-logic/api/supabase';
import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {RegionRead} from 'generated/dataLayer/region_read';
import {DepartementRead} from 'generated/dataLayer/departement_read';
import {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {PostgrestFilterBuilder} from '@supabase/postgrest-js';

const screenIsMobile = () =>
  window.innerHeight <= 800 && window.innerWidth <= 600;

export const NB_CARDS_PER_PAGE = screenIsMobile() ? 2 : 16;

// A subset of supabase FilterOperator as it not an exported type.
type FilterOperator = 'in' | 'ov';

/**
 * Construit la query en ajoutant des opérateurs Postgrest pour chaque filtre.
 */
const buildQueryFromFilters = (
  filters: TCollectivitesFilters
): PostgrestFilterBuilder<CollectiviteCarteRead> => {
  let query = supabaseClient
    .from<CollectiviteCarteRead>('collectivite_card')
    .select('*', {count: 'exact'});

  const filter = (
    column: keyof CollectiviteCarteRead,
    operator: FilterOperator,
    possibleValues: string[] | number[]
  ) => {
    if (possibleValues.length > 0) {
      switch (operator) {
        case 'in':
          query = query.in(column, possibleValues);
          break;
        case 'ov':
          query = query.overlaps(column, possibleValues);
          break;
      }
    }
  };

  filter('region_code', 'in', filters.regions);
  filter('departement_code', 'in', filters.departments);
  filter('type_collectivite', 'in', filters.types);
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
  // en l'absence de taux sélectionné, la selection d'un référentiel équivaut
  // à un taux de remplissage qui n'est pas 0
  else if (filters.referentiel.length > 0) {
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
  let orderBy: keyof CollectiviteCarteRead;
  let ascending: boolean;
  switch (filters.trierPar) {
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
  return query;
};

/**
 * Télécharge les collectivités en fonction des filtres.
 */
export const fetchCollectiviteCards = async (
  filters: TCollectivitesFilters
): Promise<{
  collectivites: CollectiviteCarteRead[];
  collectivitesCount: number;
}> => {
  // la requête
  const query = buildQueryFromFilters(filters);

  // attends les données
  const {error, data, count} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return {
    collectivites: data || [],
    collectivitesCount: count ?? 0,
  };
};

/**
 * Télécharge toutes les régions, pour les afficher dans le filtre.
 */
export const fetchAllRegions = async (): Promise<RegionRead[]> => {
  const query = supabaseClient.from<RegionRead>('region').select();
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

/**
 * Télécharge tous les départements, pour les afficher dans le filtre.
 */
export const fetchAllDepartements = async (): Promise<DepartementRead[]> => {
  const query = supabaseClient.from<DepartementRead>('departement').select();
  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};
