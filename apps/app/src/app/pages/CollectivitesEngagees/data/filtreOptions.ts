import { referentielToName } from '@/app/app/labels';
import { appLabels } from '@/app/labels/catalog';
import { TOption } from '@/app/ui/shared/select/commons';

export const populationCollectiviteOptions: TOption[] = [
  { value: '<20000', label: appLabels.populationMoins20000 },
  { value: '20000-50000', label: appLabels.population20000_50000 },
  { value: '50000-100000', label: appLabels.population50000_100000 },
  { value: '100000-200000', label: appLabels.population100000_200000 },
  { value: '>200000', label: appLabels.populationPlus200000 },
];

export const realiseCourantCollectiviteOptions: TOption[] = [
  { value: '0-34', label: appLabels.realiseCourant0_34 },
  { value: '35-49', label: appLabels.realiseCourant35_49 },
  { value: '50-64', label: appLabels.realiseCourant50_64 },
  { value: '65-74', label: appLabels.realiseCourant65_74 },
  { value: '75-100', label: appLabels.realiseCourant75_100 },
];

export const tauxRemplissageCollectiviteOptions: TOption[] = [
  { value: '0', label: appLabels.tauxRemplissage0 },
  { value: '0-49', label: appLabels.tauxRemplissage0_49 },
  { value: '50-79', label: appLabels.tauxRemplissage50_79 },
  { value: '80-99', label: appLabels.tauxRemplissage80_99 },
  { value: '100', label: appLabels.tauxRemplissage100 },
];

export const niveauLabellisationCollectiviteOptions: TOption[] = [
  { value: '0', label: appLabels.niveauLabellisationNon },
  { value: '1', label: appLabels.niveauLabellisation1 },
  { value: '2', label: appLabels.niveauLabellisation2 },
  { value: '3', label: appLabels.niveauLabellisation3 },
  { value: '4', label: appLabels.niveauLabellisation4 },
  { value: '5', label: appLabels.niveauLabellisation5 },
];

export const getReferentielCollectiviteOptions = (
  referentielTeEnabled: boolean
): TOption[] => {
  const referentielOptions = [
    { value: 'cae', label: referentielToName['cae'] },
    { value: 'eci', label: referentielToName['eci'] },
    { value: 'te', label: referentielToName['te'] },
  ];
  return referentielTeEnabled
    ? referentielOptions
    : referentielOptions.filter((option) => option.value !== 'te');
};

export const trierParOptions: TOption[] = [
  { value: 'score', label: appLabels.trierParRealiseCourant },
  { value: 'completude', label: appLabels.tauxRemplissage },
  { value: 'nom', label: appLabels.ordreAlphabetique },
];

export const typeCollectiviteOptions: TOption[] = [
  { value: 'CA', label: appLabels.typeCollectiviteCa },
  { value: 'CC', label: appLabels.typeCollectiviteCc },
  { value: 'CU', label: appLabels.typeCollectiviteCu },
  { value: 'commune', label: appLabels.commune },
  { value: 'EPT', label: appLabels.typeCollectiviteEpt },
  { value: 'METRO', label: appLabels.typeCollectiviteMetro },
  { value: 'PETR', label: appLabels.typeCollectivitePetr },
  { value: 'POLEM', label: appLabels.typeCollectivitePolem },
  { value: 'syndicat', label: appLabels.typeCollectiviteSyndicat },
  { value: 'departement', label: appLabels.departement },
  { value: 'region', label: appLabels.region },
];
