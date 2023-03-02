import {TFicheActionNiveauxPriorite, TFicheActionStatuts} from './types/alias';
import {Personne} from './types/personne';

export const NB_ITEMS_PER_PAGE = 20;

export type TFilters = {
  /** filtre par collectivite */
  collectivite_id: number;
  /** par plan d'action ou axe */
  axes_id: number[];
  /** par personnes pilote */
  pilotes?: Personne[];
  /** par référents */
  referents?: Personne[];
  /** par statuts */
  statuts?: TFicheActionStatuts[];
  /** par priorites */
  priorites?: TFicheActionNiveauxPriorite[];
  /** index de la page voulue */
  page?: number;
};

export type TSetFilters = (newFilter: TFilters) => void;

export type TFiltreProps = {
  filters: TFilters;
  setFilters: TSetFilters;
};

export const nameToShortNames = {
  // pilotes: 'pilotes',
  referents: 'ref',
  statuts: 's',
  priorites: 'prio',
  page: 'p',
};
