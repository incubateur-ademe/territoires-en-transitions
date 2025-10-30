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

    const result = getCompletion(planData, totalFiches);

    expect(result).toEqual([
      { name: 'description', count: 4 },
      { name: 'pilotes', count: 3 },
      { name: 'objectifs', count: 6 },
      { name: 'indicateurs', count: 7 },
      { name: 'budgets', count: 5 },
      { name: 'suiviRecent', count: 8 },
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
    const totalFiches = 0;

    const result = getCompletion(planData, totalFiches);

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
    const totalFiches = 1;

    const result = getCompletion(planData, totalFiches);

    expect(result).toEqual([]);
  });
});
