import { Referentiel } from "./referentiel.ts";

export type ActionScore = {
  referentiel: Referentiel;
  action_id: string;
  point_fait: number;
  point_programme: number;
  point_pas_fait: number;
  point_non_renseigne: number;
  /** Potentiel éventuellement réduit ou augmenté par le statut non concerné ou
   * la personnalisation. Valeur identique à `point_referentiel` si pas de
   * modification. */
  point_potentiel: number;
  /** Potentiel éventuellement réduit ou augmenté par la personnalisation.
   * Undefined si pas de modification. */
  point_potentiel_perso: number | undefined;
  /** Potentiel initial (défini par le référentiel) */
  point_referentiel: number;
  concerne: boolean;
  total_taches_count: number;
  completed_taches_count: number;
  desactive: boolean;
};

export type ClientScores = {
  id: number;
  collectivite_id: number;
  referentiel: Referentiel;
  scores: ActionScore[];
  score_created_at: string;
};
