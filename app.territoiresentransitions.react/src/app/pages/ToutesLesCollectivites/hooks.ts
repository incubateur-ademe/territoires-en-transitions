import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {RegionRead} from 'generated/dataLayer/region_read';
import {useHistory, useLocation} from 'react-router-dom';
import {useQuery as useQueryString} from 'core-logic/hooks/query';
import {useEffect, useState} from 'react';
import {useQuery, useQueryClient} from 'react-query';
import {
  fetchAllDepartements,
  fetchAllRegions,
  fetchCollectiviteCards,
} from 'app/pages/ToutesLesCollectivites/queries';
import {DepartementRead} from 'generated/dataLayer/departement_read';
import type {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';

const REGIONS_PARAM = 'r';

/**
 * Returns regions.
 */
export const useRegions = (): {
  isLoading: boolean;
  regions: RegionRead[];
} => {
  const {data, isLoading} = useQuery(['region'], () => fetchAllRegions());

  return {
    isLoading: isLoading,
    regions: data || [],
  };
};

/**
 * Returns departements.
 */
export const useDepartements = (): {
  isLoading: boolean;
  departements: DepartementRead[];
} => {
  const {data, isLoading} = useQuery(['departement'], () =>
    fetchAllDepartements()
  );

  return {
    isLoading: isLoading,
    departements: data || [],
  };
};

/**
 * Returns collectivités filtered.
 */
export const useFilteredCollectivites = (
  args: TCollectivitesFilters
): {
  isLoading: boolean;
  collectivites: CollectiviteCarteRead[];
} => {
  // todo build args from params.

  const {data, isLoading} = useQuery(
    [
      'collectivite_card',
      ...args.regions,
      ...args.departments,
      ...args.population,
      ...args.types,
      ...args.realiseCourant,
      ...args.niveauDeLabellisation,
      ...args.referentiel,
      ...args.tauxDeRemplissage,
      args.trierPar,
    ],
    () => fetchCollectiviteCards(args)
  );

  return {
    isLoading: isLoading,
    collectivites: data || [],
  };
};

/**
 * Renvoie la liste des codes régions sélectionnés et la méthode pour mettre
 * à jour cette liste.
 */
export const useRegionCodesFilter = (): {
  codes: string[];
  updateCodes: (newFilters: string[]) => void;
} => {
  const {filter, setFilter} = useUrlFilterParams(REGIONS_PARAM);
  const [codes, setCodes] = useState<string[]>([]);

  const updateCodes = (codes: string[]) => setFilter(codes.join(','));

  useEffect(() => {
    const codes = filter.split(',').filter(c => c.length > 0);
    setCodes(codes);
  }, [filter]);

  return {codes, updateCodes};
};

/**
 * Permet d'utiliser un paramètre nommé `filterName` dans l'URL
 *
 * Renvoie la *valeur* du filtre (filter)
 * et la *fonction* pour mettre à jour cette valeur (setFilter).
 */
export const useUrlFilterParams = (
  filterName: string,
  initialFilter = ''
): {filter: string; setFilter: (newFilter: string) => void} => {
  const history = useHistory();
  const location = useLocation();

  const querystring = useQueryString();
  const filterValue = querystring.get(filterName) || initialFilter;

  // L'état interne mis à jour de l'extérieur via setFilter initialisé avec
  // le state de l'URL ou la valeur initiale.
  const [filter, setFilter] = useState(filterValue);

  useEffect(() => {
    // Évite de rafraichir le filtre si une autre partie de l'URL a changée.
    if (filter !== filterValue) {
      querystring.set(filterName, filter);
      // Met à jour l'URL avec React router.
      history.replace({...location, search: `?${querystring}`});
    }
  }, [filter]);

  return {filter, setFilter};
};

export const filtresVides: TCollectivitesFilters = {
  types: [],
  regions: [],
  departments: [],
  population: [],
  referentiel: [],
  niveauDeLabellisation: [],
  realiseCourant: [],
  tauxDeRemplissage: [],
  trierPar: 'nom',
};

/**
 TODO : useUrlFiltersParams
 */
export const useUrlFiltersParams = (): {
  filters: TCollectivitesFilters;
  setFilters: (newFilters: TCollectivitesFilters) => void;
} => {
  const [filters, setFilters] = useState(filtresVides);
  return {filters, setFilters};
};
