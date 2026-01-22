import { Injectable } from '@nestjs/common';
import {
  AggregatedBudget,
  BudgetType,
  BudgetUnite,
  BudgetWithTotal,
  FicheWithRelations,
} from '@tet/domain/plans';
import { roundTo } from '@tet/domain/utils';

@Injectable()
export class ComputeBudgetRules {
  private computeAggregatedBudget(
    fiches: Pick<FicheWithRelations, 'budgets'>[],
    budgetType: BudgetType | null,
    unite: BudgetUnite,
    budgetProperty: 'budgetPrevisionnel' | 'budgetReel'
  ): AggregatedBudget {
    let nbFiches = 0;
    const budget = fiches?.reduce((acc, fiche) => {
      const budgets = fiche.budgets || [];
      const budgetsByType = budgets.filter(
        (budget) =>
          (!budgetType || budget.type === budgetType) && budget.unite === unite
      );
      const budget = budgetsByType.reduce((acc, budget) => {
        return acc + (budget[budgetProperty] || 0);
      }, 0);
      if (budget) {
        nbFiches++;
      }
      return acc + budget;
    }, 0);
    return { total: roundTo(budget || 0, 2), nbFiches };
  }

  /**
   * Computes the total budget from a list of fiches
   * Aggregates budgets by unit (HT, ETP)
   *
   * @param fiches - List of fiches with their budgets
   * @returns Computed aggregated budgets
   */
  computeBudget(
    fiches: Pick<FicheWithRelations, 'budgets'>[]
  ): BudgetWithTotal {
    const result: BudgetWithTotal = {
      investissement: {
        HT: {
          budgetPrevisionnel: this.computeAggregatedBudget(
            fiches,
            'investissement',
            'HT',
            'budgetPrevisionnel'
          ),
          budgetReel: this.computeAggregatedBudget(
            fiches,
            'investissement',
            'HT',
            'budgetReel'
          ),
        },
        ETP: {
          budgetPrevisionnel: this.computeAggregatedBudget(
            fiches,
            'investissement',
            'ETP',
            'budgetPrevisionnel'
          ),
          budgetReel: this.computeAggregatedBudget(
            fiches,
            'investissement',
            'ETP',
            'budgetReel'
          ),
        },
      },
      fonctionnement: {
        HT: {
          budgetPrevisionnel: this.computeAggregatedBudget(
            fiches,
            'fonctionnement',
            'HT',
            'budgetPrevisionnel'
          ),
          budgetReel: this.computeAggregatedBudget(
            fiches,
            'fonctionnement',
            'HT',
            'budgetReel'
          ),
        },
        ETP: {
          budgetPrevisionnel: this.computeAggregatedBudget(
            fiches,
            'fonctionnement',
            'ETP',
            'budgetPrevisionnel'
          ),
          budgetReel: this.computeAggregatedBudget(
            fiches,
            'fonctionnement',
            'ETP',
            'budgetReel'
          ),
        },
      },
      total: {
        HT: {
          budgetPrevisionnel: this.computeAggregatedBudget(
            fiches,
            null,
            'HT',
            'budgetPrevisionnel'
          ),
          budgetReel: this.computeAggregatedBudget(
            fiches,
            null,
            'HT',
            'budgetReel'
          ),
        },
        ETP: {
          budgetPrevisionnel: this.computeAggregatedBudget(
            fiches,
            null,
            'ETP',
            'budgetPrevisionnel'
          ),
          budgetReel: this.computeAggregatedBudget(
            fiches,
            null,
            'ETP',
            'budgetReel'
          ),
        },
      },
    };

    return result;
  }
}
