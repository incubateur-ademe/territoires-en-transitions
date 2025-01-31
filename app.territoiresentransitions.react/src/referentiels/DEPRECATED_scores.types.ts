import { ActionCategorie, ReferentielId } from '@/domain/referentiels';
import { divisionOrZero } from '@/domain/utils';
import { TActionStatutsRow } from '../types/alias';
import { ActionDetailed } from './use-snapshot';

export interface ActionScore {
  referentiel: ReferentielId;
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
  referentiel: ReferentielId;
  scores: ActionScore[];
  score_created_at: string;
}

export type ActionReferentiel = Pick<
  TActionStatutsRow,
  | 'action_id'
  | 'identifiant'
  | 'nom'
  | 'depth'
  | 'have_children'
  | 'type'
  | 'phase'
>;

/**
 * Sous-ensemble des champs pour alimenter la table
 * @deprecated Use type from snapshot instead
 * */
export type ProgressionRow = ActionReferentiel &
  Pick<
    TActionStatutsRow,
    | 'action_id'
    | 'score_realise'
    | 'score_programme'
    | 'score_pas_fait'
    | 'score_non_renseigne'
    | 'points_realises'
    | 'points_programmes'
    | 'points_max_personnalises'
    | 'points_max_referentiel'
    | 'points_restants'
    | 'phase'
    | 'concerne'
    | 'desactive'
  >;

export function actionNewToDeprecated(action: ActionDetailed) {
  const DEPRECATED_action: ProgressionRow = {
    action_id: action.actionId,
    identifiant: action.identifiant,
    nom: action.nom,
    depth: action.level,
    type: action.actionType,
    phase: action.categorie as ActionCategorie, // Force casting for now but remove it when scores will not be coming from deprecated `client_scores` (and only from snapshot).

    points_restants: action.score.pointPotentiel - action.score.pointFait,
    points_realises: action.score.pointFait,
    points_programmes: action.score.pointProgramme,
    points_max_personnalises: action.score.pointPotentiel,
    points_max_referentiel: action.score.pointReferentiel,

    score_realise: divisionOrZero(
      action.score.pointFait,
      action.score.pointPotentiel
    ),
    score_programme: divisionOrZero(
      action.score.pointProgramme,
      action.score.pointPotentiel
    ),
    score_pas_fait: divisionOrZero(
      action.score.pointPasFait,
      action.score.pointPotentiel
    ),
    score_non_renseigne: divisionOrZero(
      action.score.pointNonRenseigne,
      action.score.pointPotentiel
    ),

    have_children: action.actionsEnfant.length > 0,
    concerne: action.score.concerne,
    desactive: action.score.desactive,
  };

  return {
    ...DEPRECATED_action,
    sourceAction: action,
  };
}
