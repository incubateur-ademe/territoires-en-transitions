import { describe, expect, it } from 'vitest';
import { collectivitesLabels } from './collectivites.labels';

describe('priorisationAnalyse', () => {
  it('accorde « issue » au singulier pour une seule action et écrit le nombre une seule fois', () => {
    expect(
      collectivitesLabels.priorisationAnalyse({
        actionsCount: 1,
        plansCount: 2,
      })
    ).toBe(
      "Analyse de 1 action issue de vos 2 plans. L'impact GES et la mobilisation sont des estimations."
    );
  });

  it("écrit « votre plan » sans nombre quand les actions viennent d'un seul plan", () => {
    expect(
      collectivitesLabels.priorisationAnalyse({
        actionsCount: 28,
        plansCount: 1,
      })
    ).toBe(
      "Analyse de 28 actions issues de votre plan. L'impact GES et la mobilisation sont des estimations."
    );
  });

  it('accorde « plans » au pluriel quand les actions viennent de plusieurs plans', () => {
    expect(
      collectivitesLabels.priorisationAnalyse({
        actionsCount: 28,
        plansCount: 3,
      })
    ).toBe(
      "Analyse de 28 actions issues de vos 3 plans. L'impact GES et la mobilisation sont des estimations."
    );
  });

  it("ne mentionne pas de plan quand la collectivité n'en a aucun", () => {
    expect(
      collectivitesLabels.priorisationAnalyse({
        actionsCount: 2,
        plansCount: 0,
      })
    ).toBe(
      "Analyse de 2 actions. L'impact GES et la mobilisation sont des estimations."
    );
  });
});
