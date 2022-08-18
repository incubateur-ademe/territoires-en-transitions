import {ActionAvancement} from 'generated/dataLayer/action_statut_read';

/* Types des données reçu par le data layer */
export type HistoriqueType =
  | 'action_statut'
  | 'action_precision'
  | 'caracteristique_collectivite'
  | 'preuve'
  | 'membre'
  | 'indicateur'
  | 'plan_action_arborescence'
  | 'plan_action_fiche';

export type THistoriqueItem = {
  collectivite_id: number;
  type: HistoriqueType;
  modified_by_id: string;
  modified_by_nom: string;
  modified_at: string;
  previous_modified_by_id: string | null;
  previous_modified_at: string | null;
  action_id: string | null; // cae_1.2.3
  action_identifiant: string | null; // 1.2.3
  action_nom: string | null;
  tache_id: string | null; // cae_1.2.3.1
  tache_identifiant: string | null; // 1.2.3.1
  tache_nom: string | null;
  avancement: ActionAvancement | null;
  previous_avancement: ActionAvancement | null;
  avancement_detaille: number[] | null;
  previous_avancement_detaille: number[] | null;
  concerne: boolean | null;
  previous_concerne: boolean | null;
  precision: string | null;
  previous_precision: string | null;
};

export type THistoriqueItemProps = {
  item: THistoriqueItem;
};
