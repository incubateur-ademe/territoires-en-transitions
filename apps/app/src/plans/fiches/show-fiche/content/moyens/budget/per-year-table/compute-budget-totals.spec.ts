import { describe, expect, it } from 'vitest';
import { BudgetPerYear } from '../../../../context/types';
import { computeBudgetTotals } from './compute-budget-totals';

const toBudgetPerYear = (budget: Partial<BudgetPerYear>): BudgetPerYear => ({
  year: 2025,
  ...budget,
});

describe('computeBudgetTotals', () => {
  it('renvoie des totaux nuls sans budget', () => {
    expect(computeBudgetTotals([])).toEqual({
      montant: 0,
      depense: 0,
      etpPrevisionnel: 0,
      etpReel: 0,
    });
  });

  it('ignore les valeurs non renseignées', () => {
    const totals = computeBudgetTotals([
      toBudgetPerYear({ year: 2024, montant: 1000 }),
      toBudgetPerYear({ year: 2025, depense: 500, etpReel: 1 }),
    ]);

    expect(totals).toEqual({
      montant: 1000,
      depense: 500,
      etpPrevisionnel: 0,
      etpReel: 1,
    });
  });

  it('additionne 0,1 et 0,2 ETP en 0,3', () => {
    const totals = computeBudgetTotals([
      toBudgetPerYear({ year: 2024, etpPrevisionnel: 0.1, etpReel: 0.1 }),
      toBudgetPerYear({ year: 2025, etpPrevisionnel: 0.2, etpReel: 0.2 }),
    ]);

    expect(totals).toEqual({
      montant: 0,
      depense: 0,
      etpPrevisionnel: 0.3,
      etpReel: 0.3,
    });
  });

  it('additionne 100,10 et 200,20 euros en 300,30', () => {
    const totals = computeBudgetTotals([
      toBudgetPerYear({ year: 2024, montant: 100.1, depense: 100.1 }),
      toBudgetPerYear({ year: 2025, montant: 200.2, depense: 200.2 }),
    ]);

    expect(totals).toEqual({
      montant: 300.3,
      depense: 300.3,
      etpPrevisionnel: 0,
      etpReel: 0,
    });
  });
});
