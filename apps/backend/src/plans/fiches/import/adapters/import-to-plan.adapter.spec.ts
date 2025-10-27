import { describe, expect, it } from 'vitest';
import { PlanImport } from '../import-plan.dto';
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
    structures: [1],
    services: [2],
    financeurs: [{ tagId: 10, montant: 5000 }],
    partenaires: [3],
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
      expect(result.data.collectiviteId).toBe(collectiviteId);
      expect(result.data.nom).toBe('Mon Plan de Test');
      expect(result.data.typeId).toBe(1);
      expect(result.data.pilotes).toEqual([{ userId: 'pilot-1', tagId: null }]);
      expect(result.data.referents).toEqual([{ userId: null, tagId: 100 }]);
      expect(result.data.fiches).toHaveLength(2);
    }
  });

  it('should correctly map fiches with their axis paths', () => {
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
      expect(result.data.fiches[0].axisPath).toEqual(['Axe 1']);
      expect(result.data.fiches[1].axisPath).toEqual(['Axe 1', 'Sous-Axe 1']);
    }
  });

  it('should correctly use toFicheWithRelations for each fiche', () => {
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
      // Check that fiche with relations has expected structure
      const firstFiche = result.data.fiches[0].fiche;
      expect(firstFiche.collectiviteId).toBe(collectiviteId);
      expect(firstFiche.titre).toBe('Fiche 1');
      expect(firstFiche.pilotes).toEqual([{ userId: 'user-123' }]);
      expect(firstFiche.referents).toEqual([{ tagId: 456 }]);
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
      expect(result.error).toContain('No resolved entities found');
      expect(result.error).toContain('Fiche 2');
      expect(result.error).toContain('Axe 2 > Missing');
    }
  });

  it('should handle plan without pilotes and referents', () => {
    const planImport = createPlanImport({
      pilotes: undefined,
      referents: undefined,
    });
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
      expect(result.data.pilotes).toBeUndefined();
      expect(result.data.referents).toBeUndefined();
    }
  });

  it('should handle plan without typeId', () => {
    const planImport = createPlanImport({
      typeId: undefined,
    });
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
      expect(result.data.typeId).toBeUndefined();
    }
  });

  it('should handle empty fiches array', () => {
    const planImport = createPlanImport({
      fiches: [],
    });
    const resolvedEntities: ResolvedFicheEntities[] = [];

    const result = adaptImportToPlanCreation(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fiches).toEqual([]);
    }
  });

  it('should match axis paths using deep equality (not reference)', () => {
    const planImport = createPlanImport({
      fiches: [
        {
          axisPath: ['Axe 1', 'Sous-Axe 1'],
          titre: 'Fiche 1',
        } as FicheImport,
      ],
    });

    // Create a NEW array with same content (different reference)
    const resolvedEntities = [
      createResolvedEntities({ axisPath: ['Axe 1', 'Sous-Axe 1'] }),
    ];

    const result = adaptImportToPlanCreation(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fiches).toHaveLength(1);
      expect(result.data.fiches[0].axisPath).toEqual(['Axe 1', 'Sous-Axe 1']);
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
    const ficheWithoutAxis = {
      axisPath: undefined,
      titre: 'Fiche sans axe',
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    };
    const ficheWithAxis = {
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
      fiches: [ficheWithoutAxis, ficheWithAxis],
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

  it('should fail when a fiche with empty axis path has no resolved entities', () => {
    const planImport = createPlanImport({
      fiches: [
        {
          titre: 'Fiche sans axe',
          structures: [],
          partenaires: [],
          services: [],
          pilotes: [],
          referents: [],
          financeurs: [],
        } as FicheImport,
      ],
    });

    const resolvedEntities: ResolvedFicheEntities[] = [];

    const result = adaptImportToPlanCreation(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('No resolved entities found');
      expect(result.error).toContain('Fiche sans axe');
      expect(result.error).toContain('axis path: no axes');
    }
  });
});
