import { BudgetType } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Budget/hooks/use-get-budget';

export type FormattedBudgetType = {
  annee: number | undefined | null;
  eurosPrevisionnel: number | undefined | null;
  eurosReel: number | undefined | null;
  etpPrevisionnel: number | undefined | null;
  etpReel: number | undefined | null;
}[];

export const getBudgetForTable = (budgets: BudgetType[]) => {
  const formattedBudget: FormattedBudgetType = [];

  budgets
    .filter((b) => !!b.annee)
    .forEach((elt) => {
      const idx = formattedBudget.findIndex((b) => b.annee === elt.annee);

      if (idx > -1) {
        if (elt.unite === 'HT') {
          formattedBudget[idx].eurosPrevisionnel = elt.budgetPrevisionnel;
          formattedBudget[idx].eurosReel = elt.budgetReel;
        } else {
          formattedBudget[idx].etpPrevisionnel = elt.budgetPrevisionnel;
          formattedBudget[idx].etpReel = elt.budgetReel;
        }
      } else {
        formattedBudget.push({
          annee: elt.annee,
          eurosPrevisionnel:
            elt.unite === 'HT' ? elt.budgetPrevisionnel : undefined,
          eurosReel: elt.unite === 'HT' ? elt.budgetReel : undefined,
          etpPrevisionnel:
            elt.unite === 'ETP' ? elt.budgetPrevisionnel : undefined,
          etpReel: elt.unite === 'ETP' ? elt.budgetReel : undefined,
        });
      }
    });

  return formattedBudget.sort((a, b) => (a.annee ?? 0) - (b.annee ?? 0));
};
