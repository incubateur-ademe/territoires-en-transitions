import { describe, expect, it } from 'vitest';
import { ImportPlanInput } from '../import-plan.input';
import { ResolvedFicheEntities } from '../resolvers/resolve-entity.service';
import {
  ImportActionInput,
  ImportSousActionInput,
} from '../schemas/import-action.input';
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
    actions: [
      {
        axisPath: ['Axe 1'],
        titre: 'Action 1',
      } as ImportActionInput,
      {
        axisPath: ['Axe 1', 'Sous-Axe 1'],
        titre: 'Action 2',
      } as ImportActionInput,
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

  it('should fail when an action has no corresponding resolved entities', () => {
    const planImport = createImportPlanInput({
      actions: [
        {
          axisPath: ['Axe 1'],
          titre: 'Action 1',
        } as ImportActionInput,
        {
          axisPath: ['Axe 2', 'Missing'],
          titre: 'Action 2',
        } as ImportActionInput,
      ],
    });

    // Only one resolved entity, but two actions
    const resolvedEntities = [createResolvedEntities({ axisPath: ['Axe 1'] })];

    const result = importPlanInputToCreatePlanAggregateInput(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain(
        'No resolved entity found for action "Action 2" (axisPath: Axe 2 > Missing)'
      );
    }
  });

  it('should handle multiple actions with the same axis path', () => {
    const planImport = createImportPlanInput({
      actions: [
        {
          axisPath: ['Axe 1'],
          titre: 'Action 1',
        } as ImportActionInput,
        {
          axisPath: ['Axe 1'],
          titre: 'Action 2',
        } as ImportActionInput,
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
      expect(result.data.fiches[0].fiche.titre).toBe('Action 1');
      expect(result.data.fiches[1].fiche.titre).toBe('Action 2');
    }
  });

  it('should handle mixed actions with and without axes', () => {
    const actionWithoutAxis: ImportActionInput = {
      axisPath: undefined,
      titre: 'Action sans axe',
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    } as unknown as ImportActionInput;
    const actionWithAxis: ImportActionInput = {
      axisPath: ['Axe 1', 'Sous-Axe 1', 'Sous-Sous-Axe 1'],
      titre: 'Action avec sous-sous-axe',
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    } as unknown as ImportActionInput;
    const planImport = createImportPlanInput({
      actions: [actionWithoutAxis, actionWithAxis],
    });

    const resolvedEntities = [
      createResolvedEntities({
        axisPath: actionWithAxis.axisPath,
        titre: actionWithAxis.titre,
      }),
      createResolvedEntities({
        axisPath: actionWithoutAxis.axisPath,
        titre: actionWithoutAxis.titre,
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
      expect(result.data.fiches[0].axisPath).toEqual(
        actionWithoutAxis.axisPath
      );
      expect(result.data.fiches[0].fiche.titre).toBe('Action sans axe');
      expect(result.data.fiches[1].axisPath).toEqual(actionWithAxis.axisPath);
      expect(result.data.fiches[1].fiche.titre).toBe(actionWithAxis.titre);
    }
  });

  it('should include instance gouvernance in the action when provided', () => {
    const actionWithInstanceGouvernance: ImportActionInput = {
      axisPath: ['Axe 1'],
      titre: 'Action avec instance de gouvernance',
      instanceGouvernance: ['Comité de pilotage', 'Conseil municipal'],
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    } as unknown as ImportActionInput;

    const planImport = createImportPlanInput({
      actions: [actionWithInstanceGouvernance],
    });

    const resolvedEntities: ResolvedFicheEntities[] = [
      {
        titre: actionWithInstanceGouvernance.titre,
        axisPath: actionWithInstanceGouvernance.axisPath,
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

  it('should use titre as the fiche title and parentActionTitre for sous-actions', () => {
    const sousAction: ImportSousActionInput = {
      axisPath: ['Axe 1'],
      titre: 'Sous-action 1.1',
      parentActionTitre: 'Action parente',
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    } as unknown as ImportSousActionInput;

    const planImport = createImportPlanInput({
      actions: [sousAction],
    });

    const resolvedEntities = [createResolvedEntities({ axisPath: ['Axe 1'] })];

    const result = importPlanInputToCreatePlanAggregateInput(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const fiche = result.data.fiches[0];
      expect(fiche.fiche.titre).toBe('Sous-action 1.1');
      expect(fiche.parentActionTitre).toBe('Action parente');
    }
  });

  it('should not set parentActionTitre for normal actions', () => {
    const normalAction: ImportActionInput = {
      axisPath: ['Axe 1'],
      titre: 'Action normale',
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    } as unknown as ImportActionInput;

    const planImport = createImportPlanInput({
      actions: [normalAction],
    });

    const resolvedEntities = [createResolvedEntities({ axisPath: ['Axe 1'] })];

    const result = importPlanInputToCreatePlanAggregateInput(
      planImport,
      resolvedEntities,
      collectiviteId
    );

    expect(result.success).toBe(true);
    if (result.success) {
      const fiche = result.data.fiches[0];
      expect(fiche.fiche.titre).toBe('Action normale');
      expect(fiche.parentActionTitre).toBeUndefined();
    }
  });

  it('should handle actions with empty instance gouvernance', () => {
    const actionWithoutInstanceGouvernance: ImportActionInput = {
      axisPath: ['Axe 1'],
      titre: 'Action sans instance de gouvernance',
      instanceGouvernance: [],
      structures: [],
      partenaires: [],
      services: [],
      pilotes: [],
      referents: [],
      financeurs: [],
    } as unknown as ImportActionInput;

    const planImport = createImportPlanInput({
      actions: [actionWithoutInstanceGouvernance],
    });

    const resolvedEntities: ResolvedFicheEntities[] = [
      {
        titre: 'Action sans instance de gouvernance',
        axisPath: actionWithoutInstanceGouvernance.axisPath,
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
