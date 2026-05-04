import { describe, expect, it } from 'vitest';
import { ResolvedFicheEntities } from '../resolvers/resolve-entity.service';
import { ImportActionInput } from '../schemas/import-action.input';
import { importActionInputToUpdateFicheInput } from './import-action-input-to-update-fiche-input';

describe('importActionInputToUpdateFicheInput', () => {
  const createResolvedEntities = (
    overrides?: Partial<ResolvedFicheEntities>
  ): ResolvedFicheEntities => ({
    titre: 'Test Action',
    axisPath: ['Axe 1'],
    pilotes: [],
    referents: [],
    structures: [],
    services: [],
    financeurs: [],
    partenaires: [],
    instanceGouvernance: [],
    ...overrides,
  });

  it('should map all action fields correctly', () => {
    const action: Partial<ImportActionInput> = {
      titre: 'Action complète',
      description: 'Description de la action',
      objectifs: 'Objectifs de la action',
      instanceGouvernance: ['Instance 1'],
      budget: 10000,
      status: 'À venir',
      priorite: 'Moyen',
    };

    const resolvedEntities = createResolvedEntities({
      instanceGouvernance: [{ id: 1, nom: 'Instance 1' }],
      structures: [{ id: 10, nom: 'Structure A' }],
      services: [{ id: 20, nom: 'Service B' }],
      partenaires: [{ id: 30, nom: 'Partenaire C' }],
      financeurs: [{ id: 40, nom: 'Financeur D', montant: 5000 }],
      pilotes: [{ userId: 'user-123' }],
      referents: [{ tagId: 456 }],
    });

    const result = importActionInputToUpdateFicheInput(
      action as ImportActionInput,
      resolvedEntities
    );

    expect(result.titre).toBe('Action complète');
    expect(result.description).toBe('Description de la action');
    expect(result.objectifs).toBe('Objectifs de la action');
    expect(result.instanceGouvernance).toEqual([{ id: 1, nom: 'Instance 1' }]);
    expect(result.budgetPrevisionnel).toBe('10000');
    expect(result.statut).toBe('À venir');
    expect(result.priorite).toBe('Moyen');
    expect(result.structures).toEqual([{ id: 10, nom: 'Structure A' }]);
    expect(result.services).toEqual([{ id: 20, nom: 'Service B' }]);
    expect(result.partenaires).toEqual([{ id: 30, nom: 'Partenaire C' }]);
    expect(result.financeurs).toEqual([
      { financeurTag: { id: 40, nom: 'Financeur D' }, montantTtc: 5000 },
    ]);
    expect(result.pilotes).toEqual([{ userId: 'user-123' }]);
    expect(result.referents).toEqual([{ tagId: 456 }]);
  });
});
