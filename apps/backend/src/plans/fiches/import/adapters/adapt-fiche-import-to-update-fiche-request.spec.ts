import { describe, expect, it } from 'vitest';
import { PlanImport } from '../import-plan.input';
import { ResolvedFicheEntities } from '../resolvers/entity-resolver.service';
import { FicheImport } from '../schemas/fiche-import.schema';
import { adaptImportToPlanCreation } from './import-to-plan.adapter';

describe('adaptImportToPlanCreation', () => {
  const collectiviteId = 42;

  const createPlanImport = (overrides?: Partial<PlanImport>): PlanImport => ({
    nom: 'Mon Plan de Test',
    typeId: 1,
    pilotes: [{ userId: 'pilot-1', tagId: null }],
    referents: [{ userId: null, tagId: 100 }],
    fiches: [
      {
        axisPath: ['Axe 1'],
        titre: 'Fiche 1',
      } as FicheImport,
      {
        axisPath: ['Axe 1', 'Sous-Axe 1'],
        titre: 'Fiche 2',
      } as FicheImport,
    ],
    ...overrides,
  });

  const createResolvedEntities = (args: {
    axisPath?: string[];
    titre?: string;
  }): ResolvedFicheEntities => ({
    titre: args.titre ?? args.axisPath?.join(' > ') ?? '',
    axisPath: args.axisPath,
    pilotes: [{ userId: 'user-123' }],
    referents: [{ tagId: 456 }],
    structures: [{ id: 1, nom: 'Structure A' }],
    services: [{ id: 2, nom: 'Service B' }],
    financeurs: [{ id: 10, nom: 'ADEME', montant: 5000 }],
    partenaires: [{ id: 3, nom: 'Partenaire C' }],
  });

  it('should successfully adapt a valid plan import to plan creation request', () => {
    const planImport = createPlanImport();
    const resolvedEntities = [
      createResolvedEntities({ axisPath: ['Axe 1'] }),
      createResolvedEntities({ axisPath: ['Axe 1', 'Sous-Axe 1'] }),
    ];

    const result = adaptImportToPlanCreation(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fiches.length).toBe(2);
    }
  });

  it('should fail when a fiche has no corresponding resolved entities', () => {
    const planImport = createPlanImport({
      fiches: [
        {
          axisPath: ['Axe 1'],
          titre: 'Fiche 1',
        } as FicheImport,
        {
          axisPath: ['Axe 2', 'Missing'],
          titre: 'Fiche 2',
        } as FicheImport,
      ],
    });

    // Only one resolved entity, but two fiches
    const resolvedEntities = [createResolvedEntities({ axisPath: ['Axe 1'] })];

    const result = adaptImportToPlanCreation(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('No resolved entity found for fiche "Fiche 2" (axisPath: Axe 2 > Missing)');
    }
  });

  it('should handle multiple fiches with the same axis path', () => {
    const planImport = createPlanImport({
      fiches: [
        {
          axisPath: ['Axe 1'],
          titre: 'Fiche 1',
        } as FicheImport,
        {
          axisPath: ['Axe 1'],
          titre: 'Fiche 2',
        } as FicheImport,
      ],
    });

    const resolvedEntities = [
      createResolvedEntities({ axisPath: ['Axe 1'] }),
      createResolvedEntities({ axisPath: ['Axe 1'] }), // Same path, potentially different entities
    ];

    const result = adaptImportToPlanCreation(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fiches).toHaveLength(2);
      expect(result.data.fiches[0].fiche.titre).toBe('Fiche 1');
      expect(result.data.fiches[1].fiche.titre).toBe('Fiche 2');
    }
  });

  it('should handle mixed fiches with and without axes', () => {
    const ficheWithoutAxis: Partial<FicheImport> = {
      axisPath: undefined,
      titre: 'Fiche sans axe',
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    };
    const ficheWithAxis: Partial<FicheImport> = {
      axisPath: ['Axe 1', 'Sous-Axe 1', 'Sous-Sous-Axe 1'],
      titre: 'Fiche avec sous-sous-axe',
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    };
    const planImport = createPlanImport({
      fiches: [ficheWithoutAxis as FicheImport, ficheWithAxis as FicheImport],
    });

    const resolvedEntities = [
      createResolvedEntities({
        axisPath: ficheWithAxis.axisPath,
        titre: ficheWithAxis.titre,
      }),
      createResolvedEntities({
        axisPath: ficheWithoutAxis.axisPath,
        titre: ficheWithoutAxis.titre,
      }),
    ];

    const result = adaptImportToPlanCreation(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fiches.length).toBe(2);
      expect(result.data.fiches[0].axisPath).toEqual(ficheWithoutAxis.axisPath);
      expect(result.data.fiches[0].fiche.titre).toBe('Fiche sans axe');
      expect(result.data.fiches[1].axisPath).toEqual(ficheWithAxis.axisPath);
      expect(result.data.fiches[1].fiche.titre).toBe(ficheWithAxis.titre);
    }
  });

});
