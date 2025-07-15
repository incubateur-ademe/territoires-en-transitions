import {
  TFicheActionEcheances,
  TFicheActionNiveauxPriorite,
  TFicheActionStatuts,
} from '@/app/types/alias';
import {
  SANS_PILOTE_LABEL,
  SANS_PRIORITE_LABEL,
  SANS_REFERENT_LABEL,
  SANS_STATUT_LABEL,
} from '@/backend/plans/fiches/shared/labels';

export type RawFilters = {
  /** filtre par collectivite */
  collectivite_id: number;
  /** par id plan d'action ou axe */
  axes?: number[];
  /** par fiches non classées */
  sans_plan?: number;
  /** par personnes pilote */
  pilotes?: string[];
  /** sans pilote */
  sans_pilote?: string[];
  /** par référents */
  referents?: string[];
  /** sans référent */
  sans_referent?: string[];
  /** par statuts */
  statuts?: TFicheActionStatuts[];
  /** sans statut */
  sans_statut?: string[];
  /** par priorites */
  priorites?: TFicheActionNiveauxPriorite[];
  /** sans niveau de priorité */
  sans_niveau?: string[];
  /** par échéance */
  echeance?: TFicheActionEcheances;
  /** index de la page voulue */
  page?: number;
};

export type Filters = {
  collectivite_id: number;
  axes: number[];
  priorites?: PrioriteOrNot[];
  statuts?: StatutOrNot[];
  referents?: ReferentOrNot[];
  pilotes?: PiloteOrNot[];
};

export const filterLabels: Record<keyof Filters, string> = {
  priorites: 'Niveau de priorité',
  statuts: 'Statut',
  referents: 'Élu·e référent·e',
  pilotes: 'Personne pilote',
  collectivite_id: 'Collectivité',
  axes: 'Axe',
};
export type PrioriteOrNot =
  | TFicheActionNiveauxPriorite
  | typeof SANS_PRIORITE_LABEL;
export type StatutOrNot = TFicheActionStatuts | typeof SANS_STATUT_LABEL;
export type ReferentOrNot = string | typeof SANS_REFERENT_LABEL;
export type PiloteOrNot = string | typeof SANS_PILOTE_LABEL;
