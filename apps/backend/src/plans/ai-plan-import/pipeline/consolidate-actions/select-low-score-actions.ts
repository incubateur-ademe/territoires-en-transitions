import { ExtractedAction } from '../../models/extracted-action';

export const CONSOLIDATION_SCORE_THRESHOLD = 90;

export type IndexedAction = { index: number; action: ExtractedAction };

export const selectLowScoreActions = (
  actions: ExtractedAction[]
): IndexedAction[] =>
  actions
    .map((action, index) => ({ index, action }))
    .filter(
      ({ action }) =>
        action.confidence !== null &&
        action.confidence.score < CONSOLIDATION_SCORE_THRESHOLD
    );
