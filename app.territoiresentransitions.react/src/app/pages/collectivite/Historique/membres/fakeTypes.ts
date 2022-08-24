import {NiveauAcces} from 'generated/dataLayer';
import {ActionAvancement} from 'generated/dataLayer/action_statut_read';
import {QuestionType} from 'generated/dataLayer/question_read';

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
  tache_id: string | null; // cae_1.2.3.1
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
  question_type: keyof typeof QuestionType | null;
  question_id: string | null;
  question_formulation: string | null;
  thematique_id: string | null;
  thematique_nom: string | null;
  reponse: string | boolean | number | null;
  previous_reponse: string | boolean | number | null;

  /** modif. d'un membre de la collectivité */
  membre_concerne: string | null;
  previous_membre_acces: NiveauAcces | null;
  new_membre_acces: NiveauAcces | null;
  champ_modifie: MembreChampModifie | null;
  previous_champ_modifie: string | null;
  new_champ_modifie: string | null;
};

export type THistoriqueItemProps = {
  item: THistoriqueItem;
};

export type MembreChampModifie =
  | 'fonction'
  | 'champ_intervention'
  | 'details_fonction'
  | 'acces';
