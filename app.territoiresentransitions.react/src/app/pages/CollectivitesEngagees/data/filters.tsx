export type TView = 'collectivite' | 'plan';

export type TFilterPlan = {
  typesPlan: string[];
};

export type TFilterCollectivite = {
  nom?: string;
  regions: string[];
  departments: string[];
  typesCollectivite: string[];
  population: string[];
};

export type Tfilters = {
  vue: TView[];
  referentiel: string[];
  niveauDeLabellisation: string[];
  realiseCourant: string[];
  tauxDeRemplissage: string[];
  trierPar?: string[];
  page?: number;
} & TFilterCollectivite &
  TFilterPlan;

export type TSetFilters = (newFilters: Tfilters) => void;

// valeurs par défaut des filtres
export const initialFilters: Tfilters = {
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

const notEmpty = (l: string[]): boolean => l.length > 0;

export const getNumberOfActiveFilters = (filtres: Tfilters): number => {
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
