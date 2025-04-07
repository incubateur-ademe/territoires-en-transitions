import { Action } from '@/app/referentiels/actions/use-list-actions';
import { ScoreFinal } from '@/domain/referentiels';

/**
 * This type combines an action with its status and score,
 * which is what we need in the PDF.
 */
export type ActionWithStatutAndScore = Action & {
  score: ScoreFinal;
};
