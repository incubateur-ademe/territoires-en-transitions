import { CollectiviteEngagee } from '@tet/api';
import { parseAsArrayOf, parseAsInteger, parseAsString, UrlKeys } from 'nuqs';

export const MAX_NUMBER_OF_CARDS_PER_PAGE = 16;

export const getFilterProperties = (args: CollectiviteEngagee.Filters) => {
  return {
    ...args,
    nbCards: MAX_NUMBER_OF_CARDS_PER_PAGE,
  };
};

const notEmpty = (l?: unknown[]): boolean => (l ? l.length > 0 : false);

export const getNumberOfActiveFilters = (
  filtres: CollectiviteEngagee.Filters
): number => {
  return (
    Number(notEmpty(filtres.regions)) +
    Number(notEmpty(filtres.departments)) +
    Number(notEmpty(filtres.tauxDeRemplissage)) +
    Number(notEmpty(filtres.niveauDeLabellisation)) +
    Number(notEmpty(filtres.population)) +
    Number(notEmpty(filtres.realiseCourant)) +
    Number(notEmpty(filtres.typesCollectivite)) +
    Number(notEmpty(filtres.typesPlan)) +
    Number(notEmpty(filtres.referentiel)) +
    Number(filtres.nom && filtres.nom.length > 0)
  );
};

export type SetFilters = (newFilters: CollectiviteEngagee.Filters) => void;
// valeurs par défaut des filtres
export const initialFilters: CollectiviteEngagee.Filters = {
  nom: '',
  typesPlan: [],
  typesCollectivite: [],
  regions: [],
  departments: [],
  population: [],
  referentiel: [],
  niveauDeLabellisation: [],
  realiseCourant: [],
  tauxDeRemplissage: [],
  trierPar: ['nom'],
};

export const filtersParsers = {
  nom: parseAsString.withDefault(''),
  typesPlan: parseAsArrayOf(parseAsInteger).withDefault([]),
  typesCollectivite: parseAsArrayOf(parseAsString).withDefault([]),
  regions: parseAsArrayOf(parseAsString).withDefault([]),
  departments: parseAsArrayOf(parseAsString).withDefault([]),
  population: parseAsArrayOf(parseAsString).withDefault([]),
  referentiel: parseAsArrayOf(parseAsString).withDefault([]),
  niveauDeLabellisation: parseAsArrayOf(parseAsString).withDefault([]),
  realiseCourant: parseAsArrayOf(parseAsString).withDefault([]),
  tauxDeRemplissage: parseAsArrayOf(parseAsString).withDefault([]),
  trierPar: parseAsArrayOf(parseAsString).withDefault(['nom']),
  page: parseAsInteger.withDefault(1),
};

export const filtersUrlKeys: UrlKeys<typeof filtersParsers> = {
  nom: 'col',
  typesPlan: 'tp',
  typesCollectivite: 't',
  regions: 'r',
  departments: 'd',
  population: 'p',
  referentiel: 'ref',
  niveauDeLabellisation: 'n',
  realiseCourant: 'f',
  tauxDeRemplissage: 'c',
  trierPar: 's',
  page: 'page',
};
