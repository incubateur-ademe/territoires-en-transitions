import { describe, expect, it } from 'vitest';
import {
  createEmptyExtractedAction,
  ExtractedAction,
} from '../../models/extracted-action';
import { applyScores } from './apply-scores';

const anAction = (titre: string): ExtractedAction =>
  createEmptyExtractedAction({ axe: 'Axe 1', sousAxe: '1.1', titre });

describe('applyScores', () => {
  it('attache la confiance par index avec amelioree à false', () => {
    const actions = [anAction('A'), anAction('B')];

    const result = applyScores(actions, [
      { index: 0, score: 95, explication: '' },
      { index: 1, score: 70, explication: 'omissions partielles' },
    ]);

    expect(result[0].confidence).toEqual({
      score: 95,
      explication: '',
      amelioree: false,
    });
    expect(result[1].confidence).toEqual({
      score: 70,
      explication: 'omissions partielles',
      amelioree: false,
    });
  });

  it('laisse confidence à null pour une action non scorée', () => {
    const actions = [anAction('A'), anAction('B')];

    const result = applyScores(actions, [
      { index: 0, score: 88, explication: 'reformulation' },
    ]);

    expect(result[1].confidence).toBeNull();
  });

  it('ignore un index hors bornes sans muter les autres actions', () => {
    const actions = [anAction('A')];

    const result = applyScores(actions, [
      { index: 5, score: 50, explication: 'hors sujet' },
    ]);

    expect(result[0].confidence).toBeNull();
  });
});
