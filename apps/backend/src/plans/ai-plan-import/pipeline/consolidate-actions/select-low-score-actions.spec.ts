import { describe, expect, it } from 'vitest';
import {
  ActionConfidence,
  createEmptyExtractedAction,
  ExtractedAction,
} from '../../models/extracted-action';
import { selectLowScoreActions } from './select-low-score-actions';

const anAction = (
  titre: string,
  confidence: ActionConfidence | null
): ExtractedAction =>
  createEmptyExtractedAction({
    axe: 'Axe 1',
    sousAxe: '1.1',
    titre,
    confidence,
  });

const confidence = (score: number): ActionConfidence => ({
  score,
  explication: '',
  amelioree: false,
});

describe('selectLowScoreActions', () => {
  it('sélectionne uniquement les actions avec un score < 90, index d origine préservé', () => {
    const result = selectLowScoreActions([
      anAction('A', confidence(95)),
      anAction('B', confidence(70)),
      anAction('C', confidence(89)),
    ]);

    expect(result.map(({ index, action }) => [index, action.titre])).toEqual([
      [1, 'B'],
      [2, 'C'],
    ]);
  });

  it('ignore les actions non scorées (confidence null)', () => {
    const result = selectLowScoreActions([
      anAction('A', null),
      anAction('B', confidence(50)),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].action.titre).toBe('B');
  });
});
