import {
  BudgetType,
  BudgetUnite,
  budgetUnites,
} from '@/backend/plans/fiches/fiche-action-budget/budget.types';
import { PlanFiche } from '@/backend/plans/fiches/plan-actions.service';
import { groupBy, partition } from 'es-toolkit';

const formatUnit = (unit: BudgetUnite | string) =>
  unit === 'HT' ? '€ HT' : unit;

const formatLine = (
  value: string | number | null | undefined,
  unit: string,
  label: string
) => (value != null ? `- ${value} ${unit} ${label}` : undefined);

const formatSpreadOut = (isSpreadOut: boolean) =>
  isSpreadOut ? 'étalé dans le temps' : 'non étalé dans le temps';

export const formatBudgets = (fiche: PlanFiche, type: BudgetType): string[] => {
  const lines: string[] = [];

  // Vérifie s'il y a des budgets renseignés
  const budgets = fiche?.budgets;
  if (!budgets) return lines;

  // Vérifie s'il y a des budgets du type demandé
  const budgetsByType = budgets.filter((b) => b.type === type);
  if (budgetsByType.length === 0) return lines;

  // Récupère les budgets ayant une année et ceux sans
  const [totals, byYear] = partition(budgetsByType, (b) => b.annee === null);

  const prevLabel = 'prévisionnels';
  const reelLabel = 'dépensés';

  // Ajoute les budgets par année :
  // Crée une map des budgets par année pour pouvoir les ordonner
  const groupByYear = groupBy(byYear, (b) => b.annee!);

  // Pour chaque année
  Object.entries(groupByYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([year, entries]) => {
      lines.push(`${year} :`);
      // Pour chaque unité
      for (const unit of budgetUnites) {
        // Pour chaque enregistrement budget
        for (const b of entries.filter((e) => e.unite === unit)) {
          // Crée les lignes des budgets
          const prev = formatLine(
            b.budgetPrevisionnel,
            formatUnit(unit),
            prevLabel
          );
          const reel = formatLine(b.budgetReel, formatUnit(unit), reelLabel);
          // Ajoute les lignes des budgets
          if (prev) lines.push(`  ${prev}`);
          if (reel) lines.push(`  ${reel}`);
        }
      }
    });

  // Ajoute les budgets totals :
  // Crée une map des budgets totals par unité pour pouvoir les ordonner
  const groupByUnit = groupBy(totals, (b) => b.unite!);

  // Pour chaque unité
  Object.entries(groupByUnit).forEach(([unit, entries]) => {
    lines.push(
      `Total en ${formatUnit(unit)} (${formatSpreadOut(
        entries.some((e) => e.estEtale)
      )}):`
    );

    // Pour chaque enregistrement budget
    for (const b of entries) {
      // Crée les lignes des budgets
      const prev = formatLine(
        b.budgetPrevisionnel,
        formatUnit(unit),
        prevLabel
      );
      const reel = formatLine(b.budgetReel, formatUnit(unit), reelLabel);
      // Ajoute les lignes des budgets
      if (prev) lines.push(`  ${prev}`);
      if (reel) lines.push(`  ${reel}`);
    }
  });

  // Retourne les lignes assemblées
  return lines;
};
