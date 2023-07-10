import {
  TFicheActionEcheances,
  TFicheActionNiveauxPriorite,
  TFicheActionStatuts,
} from 'types/alias';

export type TFilters = {
  /** filtre par collectivite */
  collectivite_id: number;
  /** par id plan d'action ou axe */
  axes?: number[];
  /** par fiches non classées */
  sans_plan?: number;
  /** par personnes pilote */
  pilotes?: string[];
  /** sans pilote */
  sans_pilote?: number;
  /** par référents */
  referents?: string[];
  /** sans référent */
  sans_referent?: number;
  /** par statuts */
  statuts?: TFicheActionStatuts[];
  /** sans statut */
  sans_statut?: number;
  /** par priorites */
  priorites?: TFicheActionNiveauxPriorite[];
  /** sans niveau de priorité */
  sans_niveau?: number;
  /** par échéance */
  echeance?: TFicheActionEcheances;
  /** index de la page voulue */
  page?: number;
};

export type FiltersKeys = keyof TFilters;

export type TSetFilters = (newFilter: TFilters) => void;

export type TFiltreProps = {
  filters: TFilters;
  setFilters: TSetFilters;
};

export const nameToShortNames = {
  axes: 'axes',
  sans_plan: 'nc', // fiches non classées
  pilotes: 'pilotes',
  sans_pilote: 'sp',
  referents: 'ref',
  sans_referent: 'sr',
  statuts: 's',
  sans_statut: 'ss',
  sans_niveau: 'snp',
  priorites: 'prio',
  echeance: 'e',
  page: 'p',
};

// Constantes
export const NB_FICHES_PER_PAGE = 20;

export const SANS_PILOTE = 'sans_pilote';
export const SANS_REFERENT = 'sans_referent';
export const SANS_STATUT = 'sans_statut';
export const SANS_PRIORITE = 'sans_priorite';
