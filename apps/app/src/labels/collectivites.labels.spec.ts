import { describe, expect, it } from 'vitest';
import { collectivitesLabels } from './collectivites.labels';

describe('priorisationAnalyse', () => {
  it('accorde « issue » au singulier pour une seule action et écrit le nombre une seule fois', () => {
    expect(
      collectivitesLabels.priorisationAnalyse({
        actionsCount: 1,
        plansCount: 1,
      })
    ).toBe(
      'Analyse de 1 action issue de vos 1 plan. Les impacts et la mobilisation sont des estimations.'
    );
  });

  it('accorde « issues » au pluriel pour plusieurs actions', () => {
    expect(
      collectivitesLabels.priorisationAnalyse({
        actionsCount: 2,
        plansCount: 0,
      })
    ).toBe(
      'Analyse de 2 actions issues de vos 0 plan. Les impacts et la mobilisation sont des estimations.'
    );
  });
});
