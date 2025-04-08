import {
  ActionDefinition,
  ScoreFinal,
  StatutAvancementIncludingNonConcerne,
} from '@/domain/referentiels';

/**
 * This type combines an action with its status and score,
 * which is what we need in the PDF.
 */
export type ActionWithStatutAndScore = ActionDefinition & {
  statut: StatutAvancementIncludingNonConcerne;
  score: ScoreFinal;
};
