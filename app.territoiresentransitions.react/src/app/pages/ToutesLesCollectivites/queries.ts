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

type TBoundaries = {greaterThan: number; lowerThan: number};

const populationToBoundaries: Record<TPopulationFiltreOption, TBoundaries> = {
  '0-20000': {greaterThan: 0, lowerThan: 2000},
  '20000-50000': {greaterThan: 2000, lowerThan: 50000},
  '50000-100000': {greaterThan: 50000, lowerThan: 100000},
  '100000-200000': {greaterThan: 100000, lowerThan: 200000},
  'plus-de-200000': {greaterThan: 200000, lowerThan: 999999},
};

const tauxDeRemplissageToBoundaries: Record<
  TTauxRemplissageFiltreOption,
  TBoundaries
> = {
  '0': {greaterThan: -1, lowerThan: 1},
  '1-49': {greaterThan: 1, lowerThan: 49},
  '50-79': {greaterThan: 50, lowerThan: 79},
  '80-99': {greaterThan: 80, lowerThan: 99},
  '99-100': {greaterThan: 99, lowerThan: 101},
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
      if (!referentiel) return 'completude_max';
      return referentiel === 'eci' ? 'completude_eci' : 'completude_cae';
    case 'score':
      if (!referentiel) return 'score_fait_max';
      return referentiel === 'eci' ? 'score_fait_eci' : 'score_fait_cae';
    default:
      return 'nom';
  }
};

const updateQueryFromBoundariesFilters = (
  query: PostgrestFilterBuilder<CollectiviteCarteRead>,
  listeBoundaries: TBoundaries[],
  column: keyof CollectiviteCarteRead
) => {
  if (listeBoundaries.length > 0) {
    const firstBoundaries = listeBoundaries[0];
    query = query
      .gt(column, firstBoundaries.greaterThan)
      .lt(column, firstBoundaries.lowerThan);
    listeBoundaries.slice(1, -1).forEach(nextBoundaries => {
      query = query.or(
        `${column}.lt.${nextBoundaries.lowerThan}.gt.${nextBoundaries.greaterThan}`
      );
    });
  }
};
const buildQueryFromFiltres = (filtres: TCollectivitesFilters) => {
  let query = supabaseClient
    .from<CollectiviteCarteRead>('collectivite_card')
    .select()
    .limit(100);

  // Region
  if (filtres.regions.length > 0)
    query = query.in('region_code', filtres.regions);
  // Departement
  if (filtres.departments.length > 0)
    query = query.in('departement_code', filtres.departments);

  // Type
  if (filtres.types.length > 0) {
    query = query.in(
      'type_collectivite',
      filtres.types.map(
        type => (['commune', 'syndicat'].includes(type) ? type : 'EPCI') // TODO : change supabase view to allow filtering over different EPCI types
      )
    );
  }
  // Population
  const populationFiltresBoundaries = filtres.population.map(
    populationOption => populationToBoundaries[populationOption]
  );
  updateQueryFromBoundariesFilters(
    query,
    populationFiltresBoundaries,
    'population'
  );

  // Taux de remplissage
  if (filtres.tauxDeRemplissage.length > 0) {
    const tauxDeRemplissageFiltresBoundaries = filtres.tauxDeRemplissage.map(
      populationOption => tauxDeRemplissageToBoundaries[populationOption]
    );
    if (filtres.referentiel.length === 0) {
      updateQueryFromBoundariesFilters(
        query,
        tauxDeRemplissageFiltresBoundaries,
        'completude_max'
      );
    } else {
      if (filtres.referentiel.includes('cae')) {
        updateQueryFromBoundariesFilters(
          query,
          tauxDeRemplissageFiltresBoundaries,
          'completude_cae'
        );
      }

      if (filtres.referentiel.includes('eci')) {
        updateQueryFromBoundariesFilters(
          query,
          tauxDeRemplissageFiltresBoundaries,
          'completude_eci'
        );
      }
    }
  }
  //  Niveau de labellisation
  if (filtres.niveauDeLabellisation.length > 0) {
    if (filtres.referentiel.length === 0) {
      query = query.in(
        'etoiles_max',
        filtres.niveauDeLabellisation.map(
          niveauLabellisationOption =>
            niveauLabellisationToEtoiles[niveauLabellisationOption]
        )
      );
    } else {
      if (filtres.referentiel.includes('cae')) {
        query = query.in(
          'etoiles_cae',
          filtres.niveauDeLabellisation.map(
            niveauLabellisationOption =>
              niveauLabellisationToEtoiles[niveauLabellisationOption]
          )
        );
      }
      if (filtres.referentiel.includes('eci')) {
        query = query.in(
          'etoiles_eci',
          filtres.niveauDeLabellisation.map(
            niveauLabellisationOption =>
              niveauLabellisationToEtoiles[niveauLabellisationOption]
          )
        );
      }
    }
  }
  //  Trier par
  const trierPar = filtres.trierPar ?? 'nom';
  const sortColumn = getSortColumn(
    trierPar,
    filtres.referentiel.length === 1 ? filtres.referentiel[0] : undefined
  );
  query.order(sortColumn, {ascending: sortColumn === 'nom', nullsFirst: false});

  return query;
};

export const fetchCollectiviteCards = async (
  filtres: TCollectivitesFilters
): Promise<CollectiviteCarteRead[]> => {
  // la requête
  const query = buildQueryFromFiltres(filtres);

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const fetchAllRegions = async (): Promise<RegionRead[]> => {
  const query = supabaseClient.from<RegionRead>('region').select();
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export const fetchAllDepartements = async (): Promise<DepartementRead[]> => {
  const query = supabaseClient.from<DepartementRead>('departement').select();
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};
