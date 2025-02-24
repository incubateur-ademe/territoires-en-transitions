import { TOption } from '@/app/ui/shared/select/commons';

export const populationCollectiviteOptions: TOption[] = [
  { value: '<20000', label: 'Moins de 20 000' },
  { value: '20000-50000', label: '20 000 - 50 000' },
  { value: '50000-100000', label: '50 000 - 100 000' },
  { value: '100000-200000', label: '100 000 - 200 000' },
  { value: '>200000', label: 'Plus de 200 000' },
];

export const realiseCourantCollectiviteOptions: TOption[] = [
  { value: '0-34', label: '0 à 34 %' },
  { value: '35-49', label: '35 à 49 %' },
  { value: '50-64', label: '50 à 64 %' },
  { value: '65-74', label: '65 à 74 %' },
  { value: '75-100', label: '75 à 100 %' },
];

export const tauxRemplissageCollectiviteOptions: TOption[] = [
  { value: '0', label: '0 %' },
  { value: '0-49', label: '1 à 49 %' },
  { value: '50-79', label: '50 à 79 %' },
  { value: '80-99', label: '80 à 99 %' },
  { value: '100', label: '100 %' },
];

export const niveauLabellisationCollectiviteOptions: TOption[] = [
  { value: '0', label: 'Non labellisé' },
  { value: '1', label: 'Première étoile' },
  { value: '2', label: 'Deuxième étoile' },
  { value: '3', label: 'Troisième étoile' },
  { value: '4', label: 'Quatrième étoile' },
  { value: '5', label: 'Cinquième étoile' },
];

export const referentielCollectiviteOptions: TOption[] = [
  { value: 'eci', label: 'Économie Circulaire' },
  { value: 'cae', label: 'Climat Air Énergie' },
];

export const trierParOptions: TOption[] = [
  { value: 'score', label: '% Réalisé courant' },
  { value: 'completude', label: 'Taux de remplissage' },
  { value: 'nom', label: 'Ordre alphabétique' },
];

export const typeCollectiviteOptions: TOption[] = [
  { value: 'CA', label: "Communauté d'agglomération" },
  { value: 'CC', label: 'Communauté de communes' },
  { value: 'CU', label: 'Communauté urbaine' },
  { value: 'commune', label: 'Commune' },
  { value: 'EPT', label: 'Établissement public territorial' },
  { value: 'METRO', label: 'Métropole' },
  { value: 'PETR', label: 'Pôle d’équilibre territorial rural' },
  { value: 'POLEM', label: 'Pôle métropolitain' },
  { value: 'syndicat', label: 'Syndicat' },
  { value: 'departement', label: 'Département'},
  { value: 'region', label: 'Région'}
];
