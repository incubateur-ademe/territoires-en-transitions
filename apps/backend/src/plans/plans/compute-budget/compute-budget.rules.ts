import {
  BudgetType,
  BudgetUnite,
} from '@/backend/plans/fiches/fiche-action-budget/budget.types';
import { FicheWithRelations } from '@/backend/plans/fiches/list-fiches/fiche-action-with-relations.dto';
import { roundTo } from '@/backend/utils/number.utils';
import { Injectable } from '@nestjs/common';
import { ComputeBudgetOutput } from './compute-budget.output';

@Injectable()
export class ComputeBudgetRules {
  computeAggregatedBudget(
    fiches: Pick<FicheWithRelations, 'budgets'>[],
    budgetType: BudgetType,
    unite: BudgetUnite,
    budgetProperty: 'budgetPrevisionnel' | 'budgetReel'
  ): number {
    const budget = fiches?.reduce((acc, fiche) => {
      const budgets = fiche.budgets || [];
      const budgetsByType = budgets.filter(
        (budget) => budget.type === budgetType && budget.unite === unite
      );
      const budget = budgetsByType.reduce((acc, budget) => {
        return acc + (budget[budgetProperty] || 0);
      }, 0);
      return acc + budget;
    }, 0);
    return roundTo(budget || 0, 2);
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
  ): ComputeBudgetOutput {
    const result: ComputeBudgetOutput = {
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
    };

    return result;
  }
}
