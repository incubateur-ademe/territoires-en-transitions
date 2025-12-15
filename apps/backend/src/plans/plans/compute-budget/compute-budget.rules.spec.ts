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
            budgetPrevisionnel: 0,
            budgetReel: 0,
          },
          ETP: {
            budgetPrevisionnel: 0,
            budgetReel: 0,
          },
        },
        fonctionnement: {
          HT: {
            budgetPrevisionnel: 0,
            budgetReel: 0,
          },
          ETP: {
            budgetPrevisionnel: 0,
            budgetReel: 0,
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
            budgetPrevisionnel: 3000,
            budgetReel: 2100,
          },
          ETP: {
            budgetPrevisionnel: 0,
            budgetReel: 0,
          },
        },
        fonctionnement: {
          HT: {
            budgetPrevisionnel: 0,
            budgetReel: 0,
          },
          ETP: {
            budgetPrevisionnel: 0,
            budgetReel: 0,
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
            budgetPrevisionnel: 3000,
            budgetReel: 2300,
          },
          ETP: {
            budgetPrevisionnel: 2.5,
            budgetReel: 2.0,
          },
        },
        fonctionnement: {
          HT: {
            budgetPrevisionnel: 800,
            budgetReel: 800,
          },
          ETP: {
            budgetPrevisionnel: 2.0,
            budgetReel: 1.8,
          },
        },
      });
    });
  });
});
