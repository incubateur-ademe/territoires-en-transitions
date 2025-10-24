import { describe, expect, it } from 'vitest';
import { getCompletion } from './plan.utils';

describe('getCompletion', () => {
  it('should calculate completion percentages correctly when totalFiches > 0', () => {
    const planData = {
      titreCompleted: 8,
      descriptionCompleted: 6,
      objectifsCompleted: 4,
      pilotesCompleted: 7,
      statutCompleted: 9,
      indicateursCompleted: 3,
      budgetsCompleted: 5,
      suiviRecent: 2,
    };
    const totalFiches = 10;

    const result = getCompletion(planData, totalFiches);

    expect(result.titre).toEqual({
      count: 2,
      percentage: 80,
    });
    expect(result.description).toEqual({
      count: 4,
      percentage: 60,
    });
    expect(result.objectifs).toEqual({
      count: 6,
      percentage: 40,
    });
    expect(result.pilotes).toEqual({
      count: 3,
      percentage: 70,
    });
    expect(result.statut).toEqual({
      count: 1,
      percentage: 90,
    });
    expect(result.indicateurs).toEqual({
      count: 7,
      percentage: 30,
    });
    expect(result.budgets).toEqual({
      count: 5,
      percentage: 50,
    });
    expect(result.suiviRecent).toEqual({
      count: 8,
      percentage: 20,
    });
  });
});
