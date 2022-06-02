import {supabaseClient} from 'core-logic/api/supabase';
import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {RegionRead} from 'generated/dataLayer/region_read';
import {DepartementRead} from 'generated/dataLayer/departement_read';
import {Referentiel} from 'types/litterals';
import {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';
import {
  TNiveauLabellisationFiltreOption,
  TPopulationFiltreOption,
  TReferentielFiltreOption,
  TTauxRemplissageFiltreOption,
  TTrierParFiltreOption,
} from 'app/pages/ToutesLesCollectivites/types';
import {PostgrestFilterBuilder} from '@supabase/postgrest-js';

export type TFetchCollectiviteCardsArgs = {
  regionCodes: string[];
  departementCodes: string[];
  referentiels: Referentiel[];
  etoiles: number | null;
  score_fait_lt: number | null;
  score_fait_gt: number | null;
  completude_lt: number | null;
  completude_gt: number | null;
};

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

const populationToBoundaries: Record<TPopulationFiltreOption, TBoundaries> = {
  '0-20000': {lower: 0, upper: 2000, include: 'both'},
  '20000-50000': {lower: 2000, upper: 50000, include: 'both'},
  '50000-100000': {lower: 50000, upper: 100000, include: 'both'},
  '100000-200000': {lower: 100000, upper: 200000, include: 'both'},
  'plus-de-200000': {lower: 200000, upper: null, include: 'lower'},
};

const tauxDeRemplissageToBoundaries: Record<
  TTauxRemplissageFiltreOption,
  TBoundaries
> = {
  '0': {lower: 0, upper: 1, include: 'lower'},
  '1-49': {lower: 1, upper: 50, include: 'lower'},
  '50-79': {lower: 50, upper: 80, include: 'lower'},
  '80-99': {lower: 80, upper: 100, include: 'lower'},
  '100': {lower: 100, upper: 100, include: 'both'},
};

const niveauLabellisationToEtoiles: Record<
  TNiveauLabellisationFiltreOption,
  number
> = {
  NL: 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
};

const getSortColumn = (
  trierPar: TTrierParFiltreOption,
  referentiel?: TReferentielFiltreOption
): keyof CollectiviteCarteRead => {
  switch (trierPar) {
    case 'completude':
      if (!referentiel) return 'completude_eci'; // TODO : should be be score_fait_max instead
      return referentiel === 'eci' ? 'completude_eci' : 'completude_cae';
    case 'score':
      if (!referentiel) return 'score_fait_eci'; // TODO : should be be score_fait_max instead
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
 */
const addBoundariesToQuery = (
  query: PostgrestFilterBuilder<CollectiviteCarteRead>,
  boundaries: TBoundaries[],
  column: keyof CollectiviteCarteRead
) => {
  if (boundaries.length > 0) {
    const first = boundaries[0];
    if (first.lower) {
      if (first.include === 'lower' || first.include === 'both')
        query = query.gte(column, first.lower);
      else query = query.gt(column, first.lower);
    }

    if (first.upper) {
      if (first.include === 'upper' || first.include === 'both')
        query = query.lte(column, first.upper);
      else query = query.lt(column, first.upper);
    }

    boundaries.slice(1, -1).forEach(additional => {
      let filters = column; // the filters to use with OR

      if (additional.lower) {
        if (additional.include === 'lower' || additional.include === 'both')
          filters += `.gte.${additional.lower}`;
        else filters += `.gt.${additional.lower}`;
      }

      if (additional.upper) {
        if (additional.include === 'upper' || additional.include === 'both')
          filters += `.lte.${additional.upper}`;
        else filters += `.lt.${additional.upper}`;
      }

      query = query.or(filters);
    });
  }
};

/**
 * Construit la query en ajoutant des opérateurs Postgrest pour chaque filtre.
 */
const buildQueryFromFilters = (filters: TCollectivitesFilters) => {
  console.log('filtres', filters);
  let query = supabaseClient
    .from<CollectiviteCarteRead>('collectivite_card')
    .select()
    .limit(100);

  // Région
  if (filters.regions.length > 0)
    query = query.in('region_code', filters.regions);

  // Département
  if (filters.departments.length > 0)
    query = query.in('departement_code', filters.departments);

  // Type
  if (filters.types.length > 0) {
    query = query.in(
      'type_collectivite',
      filters.types.map(
        type => (['commune', 'syndicat'].includes(type) ? type : 'EPCI') // TODO : change supabase view to allow filtering over different EPCI types
      )
    );
  }

  // Population
  const populationFiltresBoundaries = filters.population.map(
    populationOption => populationToBoundaries[populationOption]
  );

  addBoundariesToQuery(query, populationFiltresBoundaries, 'population');

  // Taux de remplissage
  if (filters.tauxDeRemplissage.length > 0) {
    const tauxDeRemplissageFiltresBoundaries = filters.tauxDeRemplissage.map(
      populationOption => tauxDeRemplissageToBoundaries[populationOption]
    );

    if (
      filters.referentiel.length === 0 ||
      filters.referentiel.includes('cae')
    ) {
      addBoundariesToQuery(
        query,
        tauxDeRemplissageFiltresBoundaries,
        'completude_cae'
      );
    }

    if (
      filters.referentiel.length === 0 ||
      filters.referentiel.includes('eci')
    ) {
      addBoundariesToQuery(
        query,
        tauxDeRemplissageFiltresBoundaries,
        'completude_eci'
      );
    }
  }

  //  Niveau de labellisation
  if (filters.niveauDeLabellisation.length > 0) {
    if (
      filters.referentiel.length === 0 ||
      filters.referentiel.includes('cae')
    ) {
      query = query.in(
        'etoiles_cae',
        filters.niveauDeLabellisation.map(
          niveauLabellisationOption =>
            niveauLabellisationToEtoiles[niveauLabellisationOption]
        )
      );
    }
    if (
      filters.referentiel.length === 0 ||
      filters.referentiel.includes('eci')
    ) {
      query = query.in(
        'etoiles_eci',
        filters.niveauDeLabellisation.map(
          niveauLabellisationOption =>
            niveauLabellisationToEtoiles[niveauLabellisationOption]
        )
      );
    }
  }

  //  Trier par
  const trierPar = filters.trierPar ?? 'nom';
  query.order(
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
