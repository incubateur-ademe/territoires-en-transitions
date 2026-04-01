import { isBefore } from 'date-fns';
import { FicheBudgetCreate } from '../fiche-budget.schema';
import { Fiche } from '../fiche.schema';
import { StatutEnum } from '../statut.enum.schema';

export const canLinkInstanceGouvernanceToFiche = ({
  ficheCollectiviteId,
  instanceGouvernanceCollectiviteId,
}: {
  ficheCollectiviteId: number;
  instanceGouvernanceCollectiviteId: number;
}): boolean => {
  return ficheCollectiviteId === instanceGouvernanceCollectiviteId;
};

export const assertNoDuplicateBudgets = (
  budgets: FicheBudgetCreate[]
): void => {
  const seen = new Set<string>();

  budgets.forEach((budget) => {
    const key =
      budget.id !== undefined
        ? `id:${budget.id}`
        : `${budget.ficheId}:${budget.type}:${budget.unite}:${budget.annee}`;

    if (seen.has(key)) {
      throw new Error(`Duplicate budget entry: ${key}`);
    }
    seen.add(key);
  });
};

export const isFicheOnTime = ({
  statut,
  dateFin,
}: Pick<Fiche, 'statut' | 'dateFin'>): boolean => {
  if (statut === StatutEnum.REALISE || statut === StatutEnum.ABANDONNE) {
    return true;
  }
  if (!dateFin) {
    return true;
  }
  if (isBefore(new Date(Date.now()), new Date(dateFin))) {
    return true;
  }
  return false;
};
