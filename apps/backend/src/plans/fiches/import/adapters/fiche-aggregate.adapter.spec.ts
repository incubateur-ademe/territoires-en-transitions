import { describe, expect, it } from 'vitest';
import { ResolvedFicheEntities } from '../resolvers/entity-resolver.service';
import { FicheImport } from '../schemas/fiche-import.schema';
import { toFicheAggregate } from './fiche-aggregate.adapter';

describe('toFicheAggregate', () => {
  const collectiviteId = 42;

  const createBasicFicheImport = (
    overrides?: Partial<FicheImport>
  ): FicheImport => ({
    axisPath: ['Axe 1', 'Sous-Axe 1'],
    titre: 'Ma fiche test',
    description: 'Description de test',
    objectifs: 'Objectifs de test',
    pilotes: ['Jean Dupont'],
    referents: ['Marie Martin'],
    structures: ['Structure A'],
    services: ['Service B'],
    financeurs: [{ nom: 'ADEME', montant: 10000 }],
    partenaires: ['Partenaire C'],
    cible: 'Grand public',
    resources: 'Ressources de test',
    financements: 'Financements de test',
    budget: 50000,
    status: 'En cours',
    priorite: 'Élevé',
    dateDebut: new Date('2024-01-01'),
    dateFin: new Date('2024-12-31'),
    calendrier: 'Calendrier de test',
    notesComplementaire: 'Notes de test',
    instanceGouvernance: 'Instance de test',
    participation: 'consultation',
    ...overrides,
  });

  const createBasicResolvedEntities = (
    overrides?: Partial<ResolvedFicheEntities>
  ): ResolvedFicheEntities => ({
    axisPath: ['Axe 1', 'Sous-Axe 1'],
    pilotes: [{ userId: 'user-123' }],
    referents: [{ tagId: 456 }],
    structures: [1, 2],
    services: [3],
    financeurs: [{ tagId: 10, montant: 10000 }],
    partenaires: [4, 5],
    ...overrides,
  });

  it('should correctly map all fields from FicheImport to FicheAggregate', () => {
    const ficheImport = createBasicFicheImport();
    const resolvedEntities = createBasicResolvedEntities();

    const result = toFicheAggregate(
      ficheImport,
      resolvedEntities,
      collectiviteId
    );

    // Core fields
    expect(result.collectiviteId).toBe(collectiviteId);
    expect(result.titre).toBe('Ma fiche test');
    expect(result.description).toBe('Description de test');
    expect(result.objectifs).toBe('Objectifs de test');

    // Dates
    expect(result.dateDebut).toEqual(new Date('2024-01-01'));
    expect(result.dateFin).toEqual(new Date('2024-12-31'));

    // Status and priority (transformed by schema)
    expect(result.statut).toBe('En cours');
    expect(result.priorite).toBe('Élevé');

    // Budget
    expect(result.budgetPrevisionnel).toBe(50000);
    expect(result.financements).toBe('Financements de test');

    // Other text fields
    expect(result.ressources).toBe('Ressources de test');
    expect(result.calendrier).toBe('Calendrier de test');
    expect(result.notesComplementaires).toBe('Notes de test');
    expect(result.instanceGouvernance).toBe('Instance de test');
    expect(result.participationCitoyenneType).toBe('consultation');
  });

  it('should correctly map resolved entities', () => {
    const ficheImport = createBasicFicheImport();
    const resolvedEntities = createBasicResolvedEntities();

    const result = toFicheAggregate(
      ficheImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.pilotes).toEqual([{ userId: 'user-123' }]);
    expect(result.referents).toEqual([{ tagId: 456 }]);
    expect(result.structures).toEqual([1, 2]);
    expect(result.services).toEqual([3]);
    expect(result.financeurs).toEqual([{ tagId: 10, montant: 10000 }]);
    expect(result.partenaires).toEqual([4, 5]);
  });
});
