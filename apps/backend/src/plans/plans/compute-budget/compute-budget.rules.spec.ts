import { Test } from '@nestjs/testing';
import { FicheWithRelations } from '@tet/domain/plans';
import { ComputeBudgetRules } from './compute-budget.rules';

describe('ComputeBudgetRules', () => {
  let computeBudgetRules: ComputeBudgetRules;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [ComputeBudgetRules],
    }).compile();

    computeBudgetRules = moduleRef.get(ComputeBudgetRules);
  });

  describe('computeBudget', () => {
    it('should return all zeros when there are no fiches', () => {
      const fiches: Pick<FicheWithRelations, 'budgets'>[] = [];
      const result = computeBudgetRules.computeBudget(fiches);
      expect(result).toEqual({
        investissement: {
          HT: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
          ETP: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
        },
        fonctionnement: {
          HT: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
          ETP: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
        },
        total: {
          HT: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
          ETP: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
        },
      });
    });

    it('should compute budget for a simple case with only one type and unit', () => {
      const fiches: Pick<FicheWithRelations, 'budgets'>[] = [
        {
          budgets: [
            {
              id: 1,
              ficheId: 1,
              type: 'investissement',
              unite: 'HT',
              budgetPrevisionnel: 1000,
              budgetReel: null,
            },
            {
              id: 2,
              ficheId: 1,
              type: 'investissement',
              unite: 'HT',
              budgetPrevisionnel: null,
              budgetReel: 600,
            },
          ],
        },
        {
          budgets: [
            {
              id: 3,
              ficheId: 2,
              type: 'investissement',
              unite: 'HT',
              budgetPrevisionnel: 2000,
              budgetReel: 1500,
            },
          ],
        },
      ];
      const result = computeBudgetRules.computeBudget(fiches);
      expect(result).toEqual({
        investissement: {
          HT: {
            budgetPrevisionnel: { total: 3000, nbFiches: 2 },
            budgetReel: { total: 2100, nbFiches: 2 },
          },
          ETP: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
        },
        fonctionnement: {
          HT: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
          ETP: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
        },
        total: {
          HT: {
            budgetPrevisionnel: { total: 3000, nbFiches: 2 },
            budgetReel: { total: 2100, nbFiches: 2 },
          },
          ETP: {
            budgetPrevisionnel: { total: 0, nbFiches: 0 },
            budgetReel: { total: 0, nbFiches: 0 },
          },
        },
      });
    });

    it('should compute budget for a complex case with multiple types and units', () => {
      const fiches: Pick<FicheWithRelations, 'budgets'>[] = [
        {
          budgets: [
            {
              id: 1,
              ficheId: 1,
              type: 'investissement',
              unite: 'HT',
              budgetPrevisionnel: 1000,
              budgetReel: 800,
            },
            {
              id: 2,
              ficheId: 1,
              type: 'investissement',
              unite: 'ETP',
              budgetPrevisionnel: 2.5,
              budgetReel: 2.0,
            },
            {
              id: 3,
              ficheId: 1,
              type: 'fonctionnement',
              unite: 'HT',
              budgetPrevisionnel: 500,
              budgetReel: 450,
            },
          ],
        },
        {
          budgets: [
            {
              id: 4,
              ficheId: 2,
              type: 'investissement',
              unite: 'HT',
              budgetPrevisionnel: 2000,
              budgetReel: 1500,
            },
            {
              id: 5,
              ficheId: 2,
              type: 'fonctionnement',
              unite: 'ETP',
              budgetPrevisionnel: 1.5,
              budgetReel: 1.2,
            },
          ],
        },
        {
          budgets: [
            {
              id: 6,
              ficheId: 3,
              type: 'fonctionnement',
              unite: 'HT',
              budgetPrevisionnel: 300,
              budgetReel: 350,
            },
            {
              id: 7,
              ficheId: 3,
              type: 'fonctionnement',
              unite: 'ETP',
              budgetPrevisionnel: 0.5,
              budgetReel: 0.6,
            },
          ],
        },
        {
          budgets: null,
        },
      ];
      const result = computeBudgetRules.computeBudget(fiches);
      expect(result).toEqual({
        investissement: {
          HT: {
            budgetPrevisionnel: { total: 3000, nbFiches: 2 },
            budgetReel: { total: 2300, nbFiches: 2 },
          },
          ETP: {
            budgetPrevisionnel: { total: 2.5, nbFiches: 1 },
            budgetReel: { total: 2.0, nbFiches: 1 },
          },
        },
        fonctionnement: {
          HT: {
            budgetPrevisionnel: { total: 800, nbFiches: 2 },
            budgetReel: { total: 800, nbFiches: 2 },
          },
          ETP: {
            budgetPrevisionnel: { total: 2.0, nbFiches: 2 },
            budgetReel: { total: 1.8, nbFiches: 2 },
          },
        },
        total: {
          HT: {
            budgetPrevisionnel: { total: 3800, nbFiches: 3 },
            budgetReel: { total: 3100, nbFiches: 3 },
          },
          ETP: {
            budgetPrevisionnel: { total: 4.5, nbFiches: 3 },
            budgetReel: { total: 3.8, nbFiches: 3 },
          },
        },
      });
    });
  });
});
