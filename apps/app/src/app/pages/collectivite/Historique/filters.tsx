import { appLabels } from '@/app/labels/catalog';
import { HistoriqueType } from '@tet/domain/referentiels';

export const filtresTypeOptions: { value: HistoriqueType; label: string }[] = [
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
  types: HistoriqueType[] | null;
  /** par plage de dates */
  startDate: string | null;
  endDate: string | null;
  /** index de la page voulue */
  page: number | null;
};

export type FiltersPatch = Partial<Filters>;

export const withPageReset = (patch: FiltersPatch): FiltersPatch => {
  const hasNonPageChange = Object.keys(patch).some((key) => key !== 'page');
  const hasExplicitPage = 'page' in patch;

  if (!hasNonPageChange || hasExplicitPage) {
    return patch;
  }

  return { ...patch, page: null };
};

export type SetFilters = (patch: FiltersPatch | null) => void;

export type FiltreProps = {
  filters: Filters;
  setFilters: SetFilters;
};
