import { ExtractedAction } from '../../models/extracted-action';
import { ScoringEntry } from './score-actions.schema';

export const applyScores = (
  actions: ExtractedAction[],
  scores: ScoringEntry[]
): ExtractedAction[] => {
  const scoreByIndex = new Map(scores.map((score) => [score.index, score]));
  return actions.map((action, index) => {
    const score = scoreByIndex.get(index);
    if (!score) {
      return action;
    }
    return {
      ...action,
      confidence: {
        score: score.score,
        explication: score.explication,
        amelioree: false,
      },
    };
  });
};
