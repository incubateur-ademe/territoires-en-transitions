import { ActionWithStatut } from '@/app/referentiels/actions/use-list-actions';
import { ScoreFinal } from '@/domain/referentiels';

/**
 * This type combines an action with its status and score,
 * which is what we need in the PDF.
 */
export type ActionWithStatutAndScore = ActionWithStatut & {
  score: ScoreFinal;
};
