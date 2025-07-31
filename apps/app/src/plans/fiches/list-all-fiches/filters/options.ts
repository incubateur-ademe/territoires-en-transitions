import { typePeriodLabels } from './labels';
import { Filters, WITH, WITHOUT } from './types';

export const OPTIONS_PERIOD_TYPE: Array<{
  value: NonNullable<Filters['typePeriode']>;
  label: string;
}> = [
  { value: 'creation', label: 'de création' },
  { value: 'modification', label: 'de modification' },
  { value: 'debut', label: 'de début' },
  { value: 'fin', label: 'de fin prévisionnelle' },
];

export const FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS = [
  { label: 'Date renseignée', value: WITH },
  {
    label: 'Date non renseignée',
    value: WITHOUT,
  },
];

export const INDICATEURS_OPTIONS = [
  { label: 'Fiches avec indicateurs', value: WITH },
  { label: 'Fiches sans indicateurs', value: WITHOUT },
];

export const NOTES_DE_SUIVI_OPTIONS = [
  { label: 'Fiches avec notes de suivi', value: WITH },
  { label: 'Fiches sans notes de suivi', value: WITHOUT },
];

export const MESURES_LIEES_OPTIONS = [
  { label: 'Avec mesures liées', value: WITH },
  { label: 'Sans mesures liées', value: WITHOUT },
];

export const TYPE_PERIODE_OPTIONS = Object.entries(typePeriodLabels).map(
  ([key, value]) => ({
    value: key,
    label: value,
  })
);
