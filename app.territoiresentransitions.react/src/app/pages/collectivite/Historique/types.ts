import {ActionAvancement} from 'generated/dataLayer/action_statut_read';
import {QuestionType} from 'generated/dataLayer/question_read';
import {TFilters} from './filters';

/* Types des données reçu par le data layer */
export type HistoriqueType =
  | 'action_statut'
  | 'action_precision'
  | 'reponse'
  | 'preuve'
  | 'membre'
  | 'indicateur'
  | 'plan_action_arborescence'
  | 'plan_action_fiche';

export type THistoriqueItem = {
  /** props. communes */
  collectivite_id: number;
  type: HistoriqueType;
  modified_by_id: string;
  modified_by_nom: string;
  modified_at: string;
  previous_modified_by: string | null;
  previous_modified_at: string | null;

  /** modif. d'un statut d'action ou d'une précision */
  action_id: string | null; // cae_1.2.3
  action_identifiant: string | null; // 1.2.3
  action_nom: string | null;
  tache_identifiant: string | null; // 1.2.3.1
  tache_nom: string | null;

  /** modif. d'un statut d'action */
  avancement: ActionAvancement | null;
  previous_avancement: ActionAvancement | null;
  avancement_detaille: number[] | null;
  previous_avancement_detaille: number[] | null;
  concerne: boolean | null;
  previous_concerne: boolean | null;

  /** modif. d'une précision (à propos d'une action) */
  precision: string | null;
  previous_precision: string | null;

  /** modif. d'une réponse à une question de personnalisation des référentiels */
  action_ids: string[] | null;
  question_type: keyof typeof QuestionType | null;
  question_id: string | null;
  question_formulation: string | null;
  thematique_id: string | null;
  thematique_nom: string | null;
  reponse: string | boolean | number | null;
  previous_reponse: string | boolean | number | null;
};

export type THistoriqueItemProps = {
  item: THistoriqueItem;
};

export type THistoriqueProps = {
  items: THistoriqueItem[];
  total: number;
  filters: TFilters;
  filtersCount: number;
  setFilters: (filters: TFilters) => void;
};
