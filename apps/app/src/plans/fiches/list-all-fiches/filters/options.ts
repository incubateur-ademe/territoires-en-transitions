import { NotesOption } from '@tet/domain/plans';
import { typePeriodLabels } from './labels';
import { Filters, WITH, WITH_RECENT, WITHOUT, WITHOUT_RECENT } from './types';

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
  { label: 'Actions avec indicateurs', value: WITH },
  { label: 'Actions sans indicateurs', value: WITHOUT },
];

export const NOTES_PROPERTIES: Record<
  NotesOption,
  { label: string; value: NotesOption }
> = {
  WITH: { label: 'Actions avec notes', value: WITH },
  WITHOUT: { label: 'Actions sans notes', value: WITHOUT },
  WITH_RECENT: {
    label: 'Actions avec notes récentes (< 1 an)',
    value: WITH_RECENT,
  },
  WITHOUT_RECENT: {
    label: 'Actions sans notes récentes (> 1 an)',
    value: WITHOUT_RECENT,
  },
};

export const NOTES_OPTIONS = Object.values(NOTES_PROPERTIES);

export const MESURES_LIEES_OPTIONS = [
  { label: 'Avec mesures liées', value: WITH },
  { label: 'Sans mesures liées', value: WITHOUT },
];

export const BUDGET_OPTIONS = [
  { label: 'Actions avec budget', value: WITH },
  { label: 'Actions sans budget', value: WITHOUT },
];

export const TYPE_PERIODE_OPTIONS = Object.entries(typePeriodLabels).map(
  ([key, value]) => ({
    value: key,
    label: value,
  })
);
