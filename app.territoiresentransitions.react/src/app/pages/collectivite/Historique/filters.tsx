import {ITEM_ALL} from 'ui/shared/select/commons';
import {HistoriqueType} from './types';

export const NB_ITEMS_PER_PAGE = 10;

export type TFilterType = HistoriqueType | 'tous';

export const filtresTypeOptions: {value: TFilterType; label: string}[] = [
  {value: ITEM_ALL, label: 'Tous'},
  {value: 'action_statut', label: 'Action : statut'},
  {value: 'action_precision', label: 'Action : texte'},
  // {value: 'reponse', label: 'Caractéristique de la collectivité'},
  // {value: 'preuve', label: 'Documents et preuves'},
  // {value: 'membre', label: 'Membre'},
  // {value: 'indicateur', label: 'Indicateur'},
  // {value: 'plan_action_arborescence', label: "Plan d'action: arborescence"},
  // {value: 'plan_action_fiche', label: "Plan d'action: arborescence"},
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

export type TInitialFilters = {collectivite_id: number; action_id?: string};

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
