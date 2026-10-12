import { describe, expect, it } from 'vitest';
import { toLinkableFicheIds } from './update-action-de-reference.rules';

const existingFiches = [
  { id: 1, parentId: null },
  { id: 2, parentId: null },
  { id: 3, parentId: 1 },
];

describe('toLinkableFicheIds', () => {
  it('rend les ids demandés quand toutes les fiches existent et ne sont pas des sous-actions', () => {
    expect(
      toLinkableFicheIds({ requestedFicheIds: [2, 1], existingFiches })
    ).toEqual({ success: true, data: [2, 1] });
  });

  it('dédoublonne les ids en gardant l ordre de première apparition', () => {
    expect(
      toLinkableFicheIds({ requestedFicheIds: [2, 1, 2, 1], existingFiches })
    ).toEqual({ success: true, data: [2, 1] });
  });

  it('rend une liste vide pour une demande vide', () => {
    expect(
      toLinkableFicheIds({ requestedFicheIds: [], existingFiches })
    ).toEqual({ success: true, data: [] });
  });

  it('refuse un id qui ne correspond à aucune fiche', () => {
    expect(
      toLinkableFicheIds({ requestedFicheIds: [1, 99], existingFiches })
    ).toMatchObject({ success: false, error: 'FICHE_NOT_FOUND' });
  });

  it('refuse une sous-action', () => {
    expect(
      toLinkableFicheIds({ requestedFicheIds: [1, 3], existingFiches })
    ).toMatchObject({ success: false, error: 'FICHE_IS_SOUS_ACTION' });
  });

  it('signale la fiche inconnue avant la sous-action', () => {
    expect(
      toLinkableFicheIds({ requestedFicheIds: [3, 99], existingFiches })
    ).toMatchObject({ success: false, error: 'FICHE_NOT_FOUND' });
  });
});
