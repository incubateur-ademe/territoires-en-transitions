import { ComputeScoreMode } from '@/backend/referentiels/snapshots/compute-score-mode.enum';
import { CollectiviteAvecType } from '../../collectivites/identite-collectivite.dto';
import { ScoreFinalFields } from '../compute-score/score.dto';
import {
  ActionDefinitionEssential,
  TreeNode,
} from '../models/action-definition.dto';
import { ActionDefinition } from '../models/action-definition.table';
import { ReferentielId } from '../models/referentiel-id.enum';
import { SnapshotJalon } from './snapshot-jalon.enum';

/**
 * Score de la collectivité pour un référentiel et une date donnée
 * Inclus les scores des actions et les scores indicatifs basés sur les indicateurs
 */
export type ScoresPayload = {
  collectiviteId: number;
  referentielId: ReferentielId;
  referentielVersion: string;
  collectiviteInfo: CollectiviteAvecType;
  date: string;
  scores: TreeNode<
    Pick<ActionDefinition, 'nom' | 'identifiant' | 'categorie'> &
      ActionDefinitionEssential &
      ScoreFinalFields
  >;
  jalon: SnapshotJalon;
  auditId?: number;
  anneeAudit?: number;
  mode?: ComputeScoreMode;
};
