import {ActionReferentielScoreStorable} from 'storables/ActionReferentielScoreStorable';

export type ProgressState = 'nc' | 'alert' | 'warning' | 'ok' | 'good' | 'best';

export const inferStateFromScore = (
  score: ActionReferentielScoreStorable | null
): ProgressState => {
  const percentage: number = score ? score.percentage * 100 : 0;
  if (score && score.avancement.includes('non_concernee')) {
    return 'nc';
  } else if (percentage < 34) {
    return 'alert';
  } else if (percentage < 49) {
    return 'warning';
  } else if (percentage < 64) {
    return 'ok';
  } else if (percentage < 74) {
    return 'good';
  } else {
    return 'best';
  }
};

export const percentageTextFromScore = (
  score: ActionReferentielScoreStorable | null
) => (score ? `${(score.percentage * 100).toFixed(1)}% ` : '0.0% ');
