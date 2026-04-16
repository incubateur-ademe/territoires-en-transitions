import { appLabels } from '@/app/labels/catalog';
import { NotesOption } from '@tet/domain/plans';
import { typePeriodLabels } from './labels';
import { Filters, WITH, WITH_RECENT, WITHOUT, WITHOUT_RECENT } from './types';

export const OPTIONS_PERIOD_TYPE: Array<{
  value: NonNullable<Filters['typePeriode']>;
  label: string;
}> = [
  { value: 'creation', label: appLabels.typePeriodeCreation },
  { value: 'modification', label: appLabels.typePeriodeModification },
  { value: 'debut', label: appLabels.typePeriodeDebut },
  { value: 'fin', label: appLabels.typePeriodeFin },
];

export const FILTRE_DATE_DE_FIN_PREVISIONNELLE_OPTIONS = [
  { label: appLabels.optionDateRenseignee, value: WITH },
  {
    label: appLabels.optionDateNonRenseignee,
    value: WITHOUT,
  },
];

export const INDICATEURS_OPTIONS = [
  { label: appLabels.optionActionsAvecIndicateurs, value: WITH },
  { label: appLabels.optionActionsSansIndicateurs, value: WITHOUT },
];

export const NOTES_PROPERTIES: Record<
  NotesOption,
  { label: string; value: NotesOption }
> = {
  WITH: { label: appLabels.optionActionsAvecNotes, value: WITH },
  WITHOUT: { label: appLabels.optionActionsSansNotes, value: WITHOUT },
  WITH_RECENT: {
    label: appLabels.optionActionsAvecNotesRecentes,
    value: WITH_RECENT,
  },
  WITHOUT_RECENT: {
    label: appLabels.optionActionsSansNotesRecentes,
    value: WITHOUT_RECENT,
  },
};

export const NOTES_OPTIONS = Object.values(NOTES_PROPERTIES);

export const MESURES_LIEES_OPTIONS = [
  { label: appLabels.optionAvecMesuresLiees, value: WITH },
  { label: appLabels.optionSansMesuresLiees, value: WITHOUT },
];

export const BUDGET_OPTIONS = [
  { label: appLabels.optionActionsAvecBudget, value: WITH },
  { label: appLabels.optionActionsSansBudget, value: WITHOUT },
];

export const TYPE_PERIODE_OPTIONS = Object.entries(typePeriodLabels).map(
  ([key, value]) => ({
    value: key,
    label: value,
  })
);
