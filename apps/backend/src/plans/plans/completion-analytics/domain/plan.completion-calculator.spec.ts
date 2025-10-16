import {
  CompletionPlanData,
  getCompletion,
} from './plan.completion-calculator';

describe('Plan completion calculator', () => {
  it('should calculate completion percentages correctly when totalFiches > 0 and sort it by priority', () => {
    const planData: CompletionPlanData = {
      titre: { completed: 8 },
      description: { completed: 6 },
      objectifs: { completed: 4 },
      pilotes: { completed: 7 },
      statut: { completed: 9 },
      indicateurs: { completed: 3 },
      budgets: { completed: 5 },
      suiviRecent: { completed: 2 },
    };
    const totalFiches = 10;
    const totalFichesOlderThanOneYear = 5;
    const result = getCompletion(planData, {
      totalFiches,
      totalFichesOlderThanOneYear,
    });

    expect(result).toEqual([
      {
        name: 'description',
        count: totalFiches - planData.description.completed,
      },
      { name: 'pilotes', count: totalFiches - planData.pilotes.completed },
      { name: 'objectifs', count: totalFiches - planData.objectifs.completed },
      {
        name: 'indicateurs',
        count: totalFiches - planData.indicateurs.completed,
      },
      { name: 'budgets', count: totalFiches - planData.budgets.completed },
      { name: 'suiviRecent', count: totalFichesOlderThanOneYear - 2 },
    ]);
  });

  it('should return empty array when totalFiches is 0', () => {
    const planData: CompletionPlanData = {
      titre: { completed: 0 },
      description: { completed: 0 },
      objectifs: { completed: 0 },
      pilotes: { completed: 0 },
      statut: { completed: 0 },
      indicateurs: { completed: 0 },
      budgets: { completed: 0 },
      suiviRecent: { completed: 0 },
    };

    const result = getCompletion(planData, {
      totalFiches: 0,
      totalFichesOlderThanOneYear: 0,
    });

    expect(result).toEqual([]);
  });

  it('should return empty array when all fields are completed', () => {
    const planData: CompletionPlanData = {
      titre: { completed: 1 },
      description: { completed: 1 },
      objectifs: { completed: 1 },
      pilotes: { completed: 1 },
      statut: { completed: 1 },
      indicateurs: { completed: 1 },
      budgets: { completed: 1 },
      suiviRecent: { completed: 1 },
    };

    const result = getCompletion(planData, {
      totalFiches: 1,
      totalFichesOlderThanOneYear: 1,
    });

    expect(result).toEqual([]);
  });
});
