import { divisionOrZero } from '@tet/domain/utils';
import type { ActionDetailed } from '../../use-snapshot';

/**
 * Shape used by the audit comparison table/charts when data comes from snapshot.
 * Mirrors the fields of type_tabular_score that the UI reads.
 */
export type TabularScoreFromSnapshot = {
  score_realise: number | null;
  points_realises: number | null;
  points_max_personnalises: number | null;
  points_max_referentiel: number | null;
  points_restants: number | null;
  points_programmes: number | null;
  score_programme: number | null;
  score_pas_fait: number | null;
  score_non_renseigne: number | null;
};

export function toTabularScoreFromSnapshot(
  action: ActionDetailed
): TabularScoreFromSnapshot {
  const s = action.score;
  const pointPotentiel = s?.pointPotentiel ?? 0;
  const pointFait = s?.pointFait ?? 0;
  return {
    score_realise: divisionOrZero(pointFait, pointPotentiel),
    points_realises: s?.pointFait ?? null,
    points_max_personnalises: s?.pointPotentiel ?? null,
    points_max_referentiel: s?.pointReferentiel ?? null,
    points_restants: pointPotentiel - pointFait,
    points_programmes: s?.pointProgramme ?? null,
    score_programme: divisionOrZero(s?.pointProgramme ?? 0, pointPotentiel),
    score_pas_fait: divisionOrZero(s?.pointPasFait ?? 0, pointPotentiel),
    score_non_renseigne: divisionOrZero(s?.pointNonRenseigne ?? 0, pointPotentiel),
  };
}

/** Row shape for audit comparison when built from snapshot (referentiel fields + pre_audit/courant) */
export type ComparaisonRowFromSnapshot = {
  action_id: string;
  identifiant: string;
  nom: string;
  depth: number;
  have_children: boolean;
  type: string;
  phase: string | null;
  pre_audit: TabularScoreFromSnapshot;
  courant: TabularScoreFromSnapshot;
};

export function toComparaisonRowFromSnapshot(
  currentAction: ActionDetailed,
  preAuditAction: ActionDetailed
): ComparaisonRowFromSnapshot {
  return {
    action_id: currentAction.actionId,
    identifiant: currentAction.identifiant,
    nom: currentAction.nom,
    depth: currentAction.level,
    have_children: currentAction.actionsEnfant.length > 0,
    type: currentAction.actionType,
    phase: currentAction.categorie ?? null,
    pre_audit: toTabularScoreFromSnapshot(preAuditAction),
    courant: toTabularScoreFromSnapshot(currentAction),
  };
}
