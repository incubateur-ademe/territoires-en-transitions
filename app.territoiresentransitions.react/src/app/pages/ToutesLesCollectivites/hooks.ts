import {CollectiviteCarteRead} from 'generated/dataLayer/collectivite_carte_read';
import {RegionRead} from 'generated/dataLayer/region_read';
import {useHistory, useLocation} from 'react-router-dom';
import {useQuery as useQueryString} from 'core-logic/hooks/query';
import {useEffect, useState} from 'react';
import {useQuery} from 'react-query';
import {
  fetchAllDepartements,
  fetchAllRegions,
  fetchCollectiviteCards,
} from 'app/pages/ToutesLesCollectivites/queries';
import {DepartementRead} from 'generated/dataLayer/departement_read';
import type {TCollectivitesFilters} from 'app/pages/ToutesLesCollectivites/filtreLibelles';

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
    regions: (data as RegionRead[]) || [],
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
    departements: (data as DepartementRead[]) || [],
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
  collectivitesCount: number;
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
      args.page,
      args.nom,
      args.trierPar,
    ],
    () => fetchCollectiviteCards(args)
  );

  return {
    isLoading: isLoading,
    collectivites: data?.collectivites || [],
    collectivitesCount: data?.collectivitesCount || 0,
  };
};

/**
 * Permet d'utiliser un paramètre nommé `paramName` dans l'URL
 *
 * Renvoie la *valeur* du paramètre (param)
 * et la *fonction* pour mettre à jour cette valeur (setParam).
 */
export const useUrlParam = (
  paramName: string,
  defaultValue = ''
): {param: string; setParam: (newParam: string) => void} => {
  const history = useHistory();
  const location = useLocation();

  const querystring = useQueryString();
  const paramValue = querystring.get(paramName) || defaultValue;

  // L'état interne mis à jour de l'extérieur via setParam initialisé avec
  // le state de l'URL ou la valeur initiale.
  const [param, setParam] = useState(paramValue);

  useEffect(() => {
    // Évite de rafraichir le filtre si une autre partie de l'URL a changée.
    if (param !== paramValue) {
      querystring.set(paramName, param);
      // Met à jour l'URL avec React router.
      history.replace({...location, search: `?${querystring}`});
    }
  }, [param]);

  return {param, setParam};
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
  trierPar: 'score',
};

const paramToList = (s: string) => s.split('.').filter(r => r.length > 0);
const listToParam = (l: string[]) => l.join('.');

/**
 * Renvoie les filtres et la méthode pour remplacer cet objet.
 */
export const useFiltersParams = (): {
  filters: TCollectivitesFilters;
  setFilters: (newFilters: TCollectivitesFilters) => void;
} => {
  const [synced, setSynced] = useState(false);
  const [filters, setFilters] = useState(filtresVides);
  const regions = useUrlParam('r');
  const departements = useUrlParam('d');

  // Met à jour les filtres avec les paramètres de l'URL lors du
  // chargement initial.
  if (!synced) {
    filters.regions = paramToList(regions.param);
    filters.departments = paramToList(departements.param);
    setSynced(true);
  }

  // Se charge de résoudre l'état des filtres.
  const updateFilters = (newFilters: TCollectivitesFilters): void => {
    // Si les régions ont changé on enlève les départements.
    if (filters.regions.length !== newFilters.regions.length) {
      newFilters.departments = [];
    }

    // Met à jour les paramètres dans l'URL
    regions.setParam(listToParam(newFilters.regions));
    departements.setParam(listToParam(newFilters.departments));

    setFilters(newFilters);
  };

  useEffect(() => {
    updateFilters(filters);
  }, [JSON.stringify(filters)]);

  return {filters: filters, setFilters: updateFilters};
};
