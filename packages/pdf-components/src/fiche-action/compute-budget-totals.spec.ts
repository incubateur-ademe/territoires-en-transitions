import { describe, expect, it } from 'vitest';
import { BudgetRow, computeBudgetTotals } from './compute-budget-totals';

const toBudgetRow = (budget: Partial<BudgetRow>): BudgetRow => ({
  eurosPrevisionnel: null,
  eurosReel: null,
  etpPrevisionnel: null,
  etpReel: null,
  ...budget,
});

describe('computeBudgetTotals', () => {
  it('renvoie des totaux nuls sans budget', () => {
    expect(computeBudgetTotals([])).toEqual({
      eurosPrevisionnel: 0,
      eurosReel: 0,
      etpPrevisionnel: 0,
      etpReel: 0,
    });
  });

  it('ignore les valeurs non renseignées', () => {
    const totals = computeBudgetTotals([
      toBudgetRow({ eurosPrevisionnel: 1000 }),
      toBudgetRow({ eurosReel: 500, etpReel: 1 }),
    ]);

    expect(totals).toEqual({
      eurosPrevisionnel: 1000,
      eurosReel: 500,
      etpPrevisionnel: 0,
      etpReel: 1,
    });
  });

  it('additionne 0,1 et 0,2 ETP en 0,3', () => {
    const totals = computeBudgetTotals([
      toBudgetRow({ etpPrevisionnel: 0.1, etpReel: 0.1 }),
      toBudgetRow({ etpPrevisionnel: 0.2, etpReel: 0.2 }),
    ]);

    expect(totals).toEqual({
      eurosPrevisionnel: 0,
      eurosReel: 0,
      etpPrevisionnel: 0.3,
      etpReel: 0.3,
    });
  });

  it('additionne 100,10 et 200,20 euros en 300,30', () => {
    const totals = computeBudgetTotals([
      toBudgetRow({ eurosPrevisionnel: 100.1, eurosReel: 100.1 }),
      toBudgetRow({ eurosPrevisionnel: 200.2, eurosReel: 200.2 }),
    ]);

    expect(totals).toEqual({
      eurosPrevisionnel: 300.3,
      eurosReel: 300.3,
      etpPrevisionnel: 0,
      etpReel: 0,
    });
  });
});
