import { appLabels } from '@/app/labels/catalog';
import { HistoriqueType } from './types';

export type FilterType = HistoriqueType;

export const filtresTypeOptions: { value: FilterType; label: string }[] = [
  { value: 'action_statut', label: appLabels.historiqueActionStatut },
  { value: 'action_precision', label: appLabels.historiqueActionPrecision },
  { value: 'reponse', label: appLabels.historiqueReponse },
  {
    value: 'justification',
    label: appLabels.historiqueJustification,
  },
];

export type Filters = {
  /** par membres de la collectivite */
  modifiedBy: string[] | null;
  /** Par type d'historique */
  types: FilterType[] | null;
  /** par plage de dates */
  startDate: string | null;
  endDate: string | null;
  /** index de la page voulue */
  page: number | null;
};

export type FiltersPatch = Partial<Filters>;

export const withPageReset = (patch: FiltersPatch): FiltersPatch => {
  const changeAutreQueLaPage = Object.keys(patch).some((key) => key !== 'page');
  const pageImposeeParLePatch = 'page' in patch;

  return changeAutreQueLaPage && !pageImposeeParLePatch
    ? { ...patch, page: null }
    : patch;
};

export type SetFilters = (patch: FiltersPatch | null) => void;

export type FiltreProps = {
  filters: Filters;
  setFilters: SetFilters;
};
