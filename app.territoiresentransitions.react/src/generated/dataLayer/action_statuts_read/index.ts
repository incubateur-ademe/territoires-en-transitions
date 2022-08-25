export interface IActionStatutsRead {
  collectivite_id: number;
  action_id: string;
  referentiel: 'eci' | 'cae';
  type: 'referentiel' | 'axe' | 'sous-axe' | 'action' | 'sous-action' | 'tache';
  children: string[];
  parents: string[];
  depth: number;
  have_children: boolean;
  identifiant: string;
  nom: string;
  description: string;
  have_exemples: boolean;
  have_ressources: boolean;
  have_reduction_potentiel: boolean;
  have_perimetre_evaluation: boolean;
  have_contexte: boolean;
  avancement:
    | null
    | 'fait'
    | 'pas_fait'
    | 'programme'
    | 'non_renseigne'
    | 'detaille';
  avancement_detaille: null | [number, number, number];
  avancement_descendants: [string];
  non_concerne: boolean;
  phase?: 'bases' | 'mise en œuvre' | 'effets';
  score_realise: number;
  score_programme: number;
  score_realise_plus_programme: number;
  score_pas_fait: number;
  score_non_renseigne: number;
  points_restants: number;
  points_realises: number;
  points_programmes: number;
  points_max_personnalises: number;
  points_max_referentiel: number;
}
