export type Tfilters = {
  nom?: string;
  types: string[];
  regions: string[];
  departments: string[];
  population: string[];
  referentiel: string[];
  niveauDeLabellisation: string[];
  realiseCourant: string[];
  tauxDeRemplissage: string[];
  trierPar?: string[];
  page?: number;
};

export type TSetFilters = (newFilters: Tfilters) => void;

// valeurs par défaut des filtres
export const initialFilters: Tfilters = {
  types: [],
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
  types: 't',
  regions: 'r',
  departments: 'd',
  population: 'p',
  referentiel: 'ref',
  niveauDeLabellisation: 'n',
  realiseCourant: 'f',
  tauxDeRemplissage: 'c',
  trierPar: 's',
};

const notEmpty = (l: string[]): boolean => l.length > 0;

export const getNumberOfActiveFilters = (filtres: Tfilters): number => {
  return (
    Number(notEmpty(filtres.regions)) +
    Number(notEmpty(filtres.departments)) +
    Number(notEmpty(filtres.tauxDeRemplissage)) +
    Number(notEmpty(filtres.niveauDeLabellisation)) +
    Number(notEmpty(filtres.population)) +
    Number(notEmpty(filtres.realiseCourant)) +
    Number(notEmpty(filtres.types)) +
    Number(notEmpty(filtres.referentiel)) +
    Number(!!filtres.nom)
  );
};
