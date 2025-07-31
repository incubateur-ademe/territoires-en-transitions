import {
  ActionCategorie,
  getIdentifiantFromActionId,
  getReferentielIdFromActionId,
  ReferentielId,
  StatutAvancement,
  StatutAvancementEnum,
} from '@/domain/referentiels';
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
    | 'avancement'
    | 'avancement_descendants'
  >;

export function actionNewToDeprecated(action: ActionDetailed) {
  const DEPRECATED_action = {
    action_id: action.actionId,
    identifiant: getIdentifiantFromActionId(action.actionId) ?? '',
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
    avancement: action.score.avancement as StatutAvancement,
    // WHEN NOT s.have_children THEN '{}'::avancement[]
    // WHEN s.pp > 0.0::double precision AND s.pnr = s.pp THEN '{non_renseigne}'::avancement[]
    // WHEN s.pnr > 0.0::double precision THEN '{non_renseigne}'::avancement[] || array_agg(DISTINCT statut.avancement)
    // ELSE array_agg(DISTINCT statut.avancement)
    avancement_descendants: !action.actionsEnfant.length
      ? []
      : action.score.pointPotentiel > 0 &&
        action.score.pointPotentiel === action.score.pointNonRenseigne
      ? [StatutAvancementEnum.NON_RENSEIGNE]
      : action.score.pointNonRenseigne > 0
      ? [
          StatutAvancementEnum.NON_RENSEIGNE,
          ...action.actionsEnfant.flatMap((a) => a.score.avancement ?? []),
        ]
      : action.actionsEnfant.flatMap((a) => a.score.avancement ?? []),
  } satisfies ProgressionRow;

  return {
    ...DEPRECATED_action,
    referentiel: getReferentielIdFromActionId(action.actionId),
    score_realise_plus_programme: divisionOrZero(
      action.score.pointFait + action.score.pointProgramme,
      action.score.pointPotentiel
    ),
    sourceAction: action,
  };
}
