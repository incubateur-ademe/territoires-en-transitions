import { FicheWithRelations } from '@tet/domain/plans';
import { describe, expect, it } from 'vitest';
import { mapSourceFicheBudgets } from './duplicated-fiche-budgets.mapper';

const sourceWithBudgets = (
  budgets: FicheWithRelations['budgets']
): FicheWithRelations => ({ budgets } as FicheWithRelations);

describe('mapSourceFicheBudgets', () => {
  it('recopie chaque budget vers la nouvelle fiche en réinitialisant ses ids', () => {
    const source = sourceWithBudgets([
      {
        id: 1,
        ficheId: 10,
        type: 'investissement',
        unite: 'HT',
        annee: 2026,
        budgetPrevisionnel: 50000,
        budgetReel: 12000,
        estEtale: false,
      },
      {
        id: 2,
        ficheId: 10,
        type: 'fonctionnement',
        unite: 'ETP',
        annee: null,
        budgetPrevisionnel: 2,
        budgetReel: null,
        estEtale: true,
      },
    ]);

    expect(mapSourceFicheBudgets(source, 99)).toEqual([
      {
        ficheId: 99,
        type: 'investissement',
        unite: 'HT',
        annee: 2026,
        budgetPrevisionnel: 50000,
        budgetReel: 12000,
        estEtale: false,
      },
      {
        ficheId: 99,
        type: 'fonctionnement',
        unite: 'ETP',
        annee: null,
        budgetPrevisionnel: 2,
        budgetReel: null,
        estEtale: true,
      },
    ]);
  });

  it('retourne un tableau vide quand la fiche source n\'a pas de budget', () => {
    expect(mapSourceFicheBudgets(sourceWithBudgets(null), 99)).toEqual([]);
  });
});
