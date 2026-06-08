import { FicheBudgetCreate, FicheWithRelations } from '@tet/domain/plans';

export function mapSourceFicheBudgets(
  source: FicheWithRelations,
  newFicheId: number
): FicheBudgetCreate[] {
  return (source.budgets ?? []).map((budget) => ({
    ficheId: newFicheId,
    type: budget.type,
    unite: budget.unite,
    annee: budget.annee,
    budgetPrevisionnel: budget.budgetPrevisionnel,
    budgetReel: budget.budgetReel,
    estEtale: budget.estEtale,
  }));
}
