import {Referentiel} from 'types/litterals';

export interface ActionScore {
  referentiel: Referentiel;
  action_id: string;
  point_fait: number;
  point_programme: number;
  point_pas_fait: number;
  point_non_renseigne: number;
  point_potentiel: number;
  point_referentiel: number;
  concerne: boolean;
  total_taches_count: number;
  completed_taches_count: number;
  point_potentiel_perso: number | undefined; // Undefined si aucune réduction n'est appliquée à cette action
  desactive: boolean;
}

export interface ClientScores {
  id: number;
  collectivite_id: number;
  referentiel: Referentiel;
  scores: ActionScore[];
  score_created_at: string;
}
