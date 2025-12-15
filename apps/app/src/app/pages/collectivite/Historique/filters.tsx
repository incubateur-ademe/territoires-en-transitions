import { HistoriqueType } from './types';

export const NB_ITEMS_PER_PAGE = 10;

export type TFilterType = HistoriqueType | 'tous';

export const filtresTypeOptions: { value: TFilterType; label: string }[] = [
  { value: 'action_statut', label: 'Mesure : statut' },
  { value: 'action_precision', label: 'Mesure : texte' },
  { value: 'reponse', label: 'Caractéristique de la collectivité : réponse' },
  {
    value: 'justification',
    label: 'Caractéristique de la collectivité : justification',
  },
];

export type TFilters = {
  /** filtre par collectivité */
  collectivite_id?: number;
  /** par action */
  action_id?: string;
  /** par membres de la collectivité */
  modified_by?: string[];
  /** Par type d'historique */
  types?: TFilterType[];
  /** par plage de dates */
  startDate?: string;
  endDate?: string;
  /** index de la page voulue */
  page?: number;
};

export type TSetFilters = (newFilter: TFilters) => void;

export type TInitialFilters = { collectivite_id: number; action_id?: string };

export type TFiltreProps = {
  filters: TFilters;
  setFilters: TSetFilters;
};

export const nameToShortNames = {
  modified_by: 'm',
  types: 't',
  startDate: 's',
  endDate: 'e',
  page: 'p',
};
