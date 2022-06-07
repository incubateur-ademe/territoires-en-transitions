import {supabaseClient} from 'core-logic/api/supabase';
import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {RegionRead} from 'generated/dataLayer/region_read';
import {DepartementRead} from 'generated/dataLayer/departement_read';
import {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {
  TReferentielFiltreOption,
  TTrierParFiltreOption,
} from 'app/pages/ToutesLesCollectivites/types';
import {PostgrestFilterBuilder} from '@supabase/postgrest-js';

/**
 * Représente des limites entre lower et upper, utilisé pour
 * construire une query Postgrest.
 *
 * Lower et upper sont optionnels.
 * Include détermine l'opérateur à utiliser.
 *
 * Ex : lower 0, upper 10, include 'lower' équivaut à `>= 0` et `< 10`.
 */
type TBoundaries = {
  lower: number | null;
  upper: number | null;
  include: 'none' | 'lower' | 'upper' | 'both';
};

const getSortColumn = (
  trierPar?: TTrierParFiltreOption,
  referentiel?: TReferentielFiltreOption
): keyof CollectiviteCarteRead => {
  switch (trierPar) {
    case 'completude':
      if (!referentiel) return 'completude_max';
      return referentiel === 'eci' ? 'completude_eci' : 'completude_cae';
    case 'score':
      if (!referentiel) return 'score_fait_max';
      return referentiel === 'eci' ? 'score_fait_eci' : 'score_fait_cae';
    default:
      return 'nom';
  }
};

/**
 * Ajoute les limites (boundaries) à la query sur une colonne.
 *
 * Permet d'utiliser plusieurs limites pour par exemple récupérer
 * les collectivités dont la population est située entre [a et b] et [x et y].
 *
 * @deprecated trop long, on devrait par exemple lorsque les plages sont
 * adjacentes les joindre.
 */
const addBoundariesToQuery = (
  query: PostgrestFilterBuilder<CollectiviteCarteRead>,
  boundaries: TBoundaries[],
  column: keyof CollectiviteCarteRead
) => {
  if (boundaries.length > 0) {
    const first = boundaries[0];
    if (first.lower !== null) {
      if (first.include === 'lower' || first.include === 'both')
        query = query.gte(column, first.lower);
      else query = query.gt(column, first.lower);
    }

    if (first.upper !== null) {
      if (first.include === 'upper' || first.include === 'both')
        query = query.lte(column, first.upper);
      else query = query.lt(column, first.upper);
    }

    boundaries.slice(1, -1).forEach(additional => {
      let filters = column; // the filters to use with OR

      if (additional.lower !== null) {
        if (additional.include === 'lower' || additional.include === 'both')
          filters += `.gte.${additional.lower}`;
        else filters += `.gt.${additional.lower}`;
      }

      if (additional.upper !== null) {
        if (additional.include === 'upper' || additional.include === 'both')
          filters += `.lte.${additional.upper}`;
        else filters += `.lt.${additional.upper}`;
      }

      query = query.or(filters);
    });
  }
};

// A subset of supabase FilterOperator as it not an exported type.
type FilterOperator = 'in' | 'ov';

/**
 * Construit la query en ajoutant des opérateurs Postgrest pour chaque filtre.
 */
const buildQueryFromFilters = (filters: TCollectivitesFilters) => {
  console.log('filtres', filters);
  let query = supabaseClient
    .from<CollectiviteCarteRead>('collectivite_card')
    .select()
    .limit(100);

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
  else if (filters.referentiel.length > 0)
    filter('completude_intervalles', 'ov', ['0-49', '50-79', '80-99', '100']);

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

  //  Trier par
  const trierPar = filters.trierPar;
  query = query.order(
    getSortColumn(
      trierPar,
      filters.referentiel.length === 1 ? filters.referentiel[0] : undefined
    )
  );

  return query;
};

/**
 * Télécharge les collectivités en fonction des filtres.
 */
export const fetchCollectiviteCards = async (
  filters: TCollectivitesFilters
): Promise<CollectiviteCarteRead[]> => {
  // la requête
  const query = buildQueryFromFilters(filters);

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
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
