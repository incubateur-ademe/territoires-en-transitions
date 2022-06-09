export type TOption = {libelle: string; id: string};

export type TCollectivitesFilters = {
  types: string[];
  regions: string[];
  departments: string[];
  population: string[];
  referentiel: string[];
  niveauDeLabellisation: string[];
  realiseCourant: string[];
  tauxDeRemplissage: string[];
  trierPar?: string;
};

// could be downloaded from `filtre_intervalle` where type = population.
export const populationCollectiviteOptions: TOption[] = [
  {id: '<20000', libelle: 'Moins de 20 000'},
  {id: '20000-50000', libelle: '20 000 - 50 000'},
  {id: '50000-100000', libelle: '50 000 - 100 000'},
  {id: '100000-200000', libelle: '100 000 - 200 000'},
  {id: '>200000', libelle: 'Plus de 200 000'},
];

// could be downloaded from `filtre_intervalle` where type = score.
export const realiseCourantCollectiviteOptions: TOption[] = [
  {id: '0-34', libelle: '0 à 34 %'},
  {id: '35-49', libelle: '35 à 49 %'},
  {id: '50-64', libelle: '50 à 64 %'},
  {id: '65-74', libelle: '65 à 74 %'},
  {id: '75-100', libelle: '75 à 100 %'},
];

// could be downloaded from `filtre_intervalle` where type = remplissage.
export const tauxRemplissageCollectiviteOptions: TOption[] = [
  {id: '0', libelle: '0 %'},
  {id: '0-49', libelle: '1 à 49 %'},
  {id: '50-79', libelle: '50 à 79 %'},
  {id: '80-99', libelle: '80 à 99 %'},
  {id: '100', libelle: '100 %'},
];

export const niveauLabellisationCollectiviteOptions: TOption[] = [
  {id: '0', libelle: 'Non labellisé'},
  {id: '1', libelle: 'Première étoile'},
  {id: '2', libelle: 'Deuxième étoile'},
  {id: '3', libelle: 'Troisième étoile'},
  {id: '4', libelle: 'Quatrième étoile'},
  {id: '5', libelle: 'Cinquième étoile'},
];

export const referentielCollectiviteOptions: TOption[] = [
  {id: 'eci', libelle: 'Économie Circulaire'},
  {id: 'cae', libelle: 'Climat Air Énergie'},
];

export const trierParOptions: TOption[] = [
  {id: 'score', libelle: '% Réalisé courant'},
  {id: 'completude', libelle: 'Taux de remplissage'},
  {id: 'nom', libelle: 'Ordre alphabétique'},
];

export const typeCollectiviteOptions: TOption[] = [
  {id: 'CA', libelle: "Communauté d'agglomération"},
  {id: 'CC', libelle: 'Communauté de communes'},
  {id: 'CU', libelle: 'Communauté urbaine'},
  {id: 'commune', libelle: 'Commune'},
  {id: 'EPT', libelle: 'Établissement public territorial'},
  {id: 'METRO', libelle: 'Métropole'},
  {id: 'PETR', libelle: 'Pôle d’équilibre territorial rural'},
  {id: 'syndicat', libelle: 'Syndicat'},
];
