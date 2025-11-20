import { CollectiviteEngagee } from '@tet/api';

const notEmpty = (l: unknown[]): boolean => l.length > 0;

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
// mapping nom des filtres => params dans l'url
export const nameToShortNames = {
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
};
