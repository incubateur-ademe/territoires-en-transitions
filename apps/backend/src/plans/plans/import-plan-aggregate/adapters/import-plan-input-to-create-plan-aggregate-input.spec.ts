import { describe, expect, it } from 'vitest';
import { ImportPlanInput } from '../import-plan.input';
import { ResolvedFicheEntities } from '../resolvers/resolve-entity.service';
import { ImportFicheInput } from '../schemas/import-fiche.input';
import { importPlanInputToCreatePlanAggregateInput } from './import-plan-input-to-create-plan-aggregate-input';

describe('importPlanInputToCreatePlanAggregateInput', () => {
  const collectiviteId = 42;

  const createImportPlanInput = (
    overrides?: Partial<ImportPlanInput>
  ): ImportPlanInput => ({
    nom: 'Mon Plan de Test',
    typeId: 1,
    pilotes: [{ userId: 'pilot-1', tagId: null }],
    referents: [{ userId: null, tagId: 100 }],
    fiches: [
      {
        axisPath: ['Axe 1'],
        titre: 'Fiche 1',
      } as ImportFicheInput,
      {
        axisPath: ['Axe 1', 'Sous-Axe 1'],
        titre: 'Fiche 2',
      } as ImportFicheInput,
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
    instanceGouvernance: [{ id: 1, nom: 'Instance A' }],
  });

  it('should successfully adapt a valid plan import to plan creation request', () => {
    const planImport = createImportPlanInput();
    const resolvedEntities = [
      createResolvedEntities({ axisPath: ['Axe 1'] }),
      createResolvedEntities({ axisPath: ['Axe 1', 'Sous-Axe 1'] }),
    ];

    const result = importPlanInputToCreatePlanAggregateInput(
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
    const planImport = createImportPlanInput({
      fiches: [
        {
          axisPath: ['Axe 1'],
          titre: 'Fiche 1',
        } as ImportFicheInput,
        {
          axisPath: ['Axe 2', 'Missing'],
          titre: 'Fiche 2',
        } as ImportFicheInput,
      ],
    });

    // Only one resolved entity, but two fiches
    const resolvedEntities = [createResolvedEntities({ axisPath: ['Axe 1'] })];

    const result = importPlanInputToCreatePlanAggregateInput(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain(
        'No resolved entity found for fiche "Fiche 2" (axisPath: Axe 2 > Missing)'
      );
    }
  });

  it('should handle multiple fiches with the same axis path', () => {
    const planImport = createImportPlanInput({
      fiches: [
        {
          axisPath: ['Axe 1'],
          titre: 'Fiche 1',
        } as ImportFicheInput,
        {
          axisPath: ['Axe 1'],
          titre: 'Fiche 2',
        } as ImportFicheInput,
      ],
    });

    const resolvedEntities = [
      createResolvedEntities({ axisPath: ['Axe 1'] }),
      createResolvedEntities({ axisPath: ['Axe 1'] }), // Same path, potentially different entities
    ];

    const result = importPlanInputToCreatePlanAggregateInput(
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
    const ficheWithoutAxis: Partial<ImportFicheInput> = {
      axisPath: undefined,
      titre: 'Fiche sans axe',
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    };
    const ficheWithAxis: Partial<ImportFicheInput> = {
      axisPath: ['Axe 1', 'Sous-Axe 1', 'Sous-Sous-Axe 1'],
      titre: 'Fiche avec sous-sous-axe',
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    };
    const planImport = createImportPlanInput({
      fiches: [
        ficheWithoutAxis as ImportFicheInput,
        ficheWithAxis as ImportFicheInput,
      ],
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

    const result = importPlanInputToCreatePlanAggregateInput(
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

  it('should include instance gouvernance in the fiche when provided', () => {
    const ficheWithInstanceGouvernance: Partial<ImportFicheInput> = {
      axisPath: ['Axe 1'],
      titre: 'Fiche avec instance de gouvernance',
      instanceGouvernance: ['Comité de pilotage', 'Conseil municipal'],
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    };

    const planImport = createImportPlanInput({
      fiches: [ficheWithInstanceGouvernance as ImportFicheInput],
    });

    const resolvedEntities: ResolvedFicheEntities[] = [
      {
        titre:
          ficheWithInstanceGouvernance.titre ??
          'Fiche avec instance de gouvernance',
        axisPath: ficheWithInstanceGouvernance.axisPath,
        pilotes: [],
        referents: [],
        structures: [],
        services: [],
        financeurs: [],
        partenaires: [],
        instanceGouvernance: [
          { id: 1, nom: 'Comité de pilotage' },
          { id: 2, nom: 'Conseil municipal' },
        ],
      },
    ];

    const result = importPlanInputToCreatePlanAggregateInput(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fiches.length).toBe(1);
      expect(result.data.fiches[0].fiche.instanceGouvernance).toEqual([
        { id: 1, nom: 'Comité de pilotage' },
        { id: 2, nom: 'Conseil municipal' },
      ]);
    }
  });

  it('should handle fiches with empty instance gouvernance', () => {
    const ficheWithoutInstanceGouvernance: Partial<ImportFicheInput> = {
      axisPath: ['Axe 1'],
      titre: 'Fiche sans instance de gouvernance',
      instanceGouvernance: [],
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    };

    const planImport = createImportPlanInput({
      fiches: [ficheWithoutInstanceGouvernance as ImportFicheInput],
    });

    const resolvedEntities: ResolvedFicheEntities[] = [
      {
        titre: 'Fiche sans instance de gouvernance',
        axisPath: ficheWithoutInstanceGouvernance.axisPath,
        pilotes: [],
        referents: [],
        structures: [],
        services: [],
        financeurs: [],
        partenaires: [],
        instanceGouvernance: [],
      },
    ];

    const result = importPlanInputToCreatePlanAggregateInput(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fiches.length).toBe(1);
      expect(result.data.fiches[0].fiche.instanceGouvernance).toEqual([]);
    }
  });
});
