import {CollectiviteEngagee} from '@tet/api';

export type TView = 'collectivite' | 'plan';

const notEmpty = (l: string[]): boolean => l.length > 0;
export const getNumberOfActiveFilters = (filtres: CollectiviteEngagee.Filters): number => {
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
    Number(!!filtres.nom)
  );
};

export type SetFilters = (newFilters: CollectiviteEngagee.Filters) => void;
// valeurs par défaut des filtres
export const initialFilters: CollectiviteEngagee.Filters = {
  vue: ['collectivite'],
  typesPlan: [],
  typesCollectivite: [],
  regions: [],
  departments: [],
  population: [],
  referentiel: [],
  niveauDeLabellisation: [],
  realiseCourant: [],
  tauxDeRemplissage: [],
  trierPar: ['score'],
};
// mapping nom des filtres => params dans l'url
export const nameToShortNames = {
  vue: 'v',
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
};
