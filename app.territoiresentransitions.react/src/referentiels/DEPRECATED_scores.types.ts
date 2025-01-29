import { Referentiel } from '@/app/referentiels/litterals';

export interface ActionScore {
  referentiel: Referentiel;
  action_id: string;
  fait_taches_avancement: number;
  pas_concerne_taches_avancement: number;
  pas_fait_taches_avancement: number;
  programme_taches_avancement: number;
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
}

export interface ClientScores {
  id: number;
  collectivite_id: number;
  referentiel: Referentiel;
  scores: ActionScore[];
  score_created_at: string;
}
