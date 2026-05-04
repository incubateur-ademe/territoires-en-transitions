import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { ApplicationSousScopesEnum } from '@tet/domain/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanErrorType } from '../plans.errors';
import { CreatePlanAggregateService } from './create-plan-aggregate.service';
import { CreatePlanAggregateInput } from './create-plan-aggregate.types';

describe('CreatePlanAggregateService', () => {
  let service: CreatePlanAggregateService;
  let mockUpsertAxeService: any;
  let mockUpsertPlanService: any;
  let mockCreateFicheService: any;
  let mockListFichesService: any;
  let mockPermissionService: any;
  let mockWebhookService: any;
  let mockTransaction: Transaction;
  let mockUser: AuthenticatedUser;
  let nextFicheId: number;

  beforeEach(() => {
    nextFicheId = 100;

    mockUpsertAxeService = {
      upsertAxe: vi.fn(),
    };

    mockUpsertPlanService = {
      upsertPlan: vi.fn(),
    };

    mockCreateFicheService = {
      createFicheWithAuthorization: vi.fn().mockImplementation(async () => {
        nextFicheId += 1;
        return success({ id: nextFicheId });
      }),
    };

    mockListFichesService = {
      listFichesQuery: vi.fn().mockResolvedValue({ data: [], count: 0 }),
    };

    mockPermissionService = {
      isAllowed: vi.fn().mockResolvedValue(true),
    };

    mockWebhookService = {
      sendWebhookNotifications: vi.fn().mockResolvedValue(undefined),
    };

    mockTransaction = {} as Transaction;

    mockUser = {
      id: 'user-123',
      role: AuthRole.AUTHENTICATED,
      isAnonymous: false,
      jwtPayload: { role: AuthRole.AUTHENTICATED },
    };

    service = new CreatePlanAggregateService(
      mockUpsertAxeService,
      mockUpsertPlanService,
      mockCreateFicheService,
      mockListFichesService,
      mockPermissionService,
      mockWebhookService
    );
  });

  describe('create', () => {
    const createValidRequest = (): CreatePlanAggregateInput => ({
      collectiviteId: 1,
      nom: 'Mon Plan Test',
      typeId: 1,
      pilotes: [{ userId: 'pilot-1', tagId: null }],
      referents: [{ userId: null, tagId: 100 }],
      fiches: [
        {
          axisPath: ['Axe 1'],
          fiche: {
            titre: 'Fiche 1',
            pilotes: [],
            referents: [],
          },
        },
        {
          axisPath: ['Axe 1', 'Sous-Axe 1'],
          fiche: {
            titre: 'Fiche 2',
            pilotes: [],
            referents: [],
          },
        },
      ],
    });

    it('should successfully create a complete plan with axes and fiches', async () => {
      const request = createValidRequest();

      mockUpsertPlanService.upsertPlan.mockResolvedValueOnce(
        success({ id: 1, nom: 'Mon Plan Test' })
      );

      mockUpsertAxeService.upsertAxe
        .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
        .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' }));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }

      expect(mockCreateFicheService.createFicheWithAuthorization).toHaveBeenCalledTimes(2);
      expect(mockUpsertPlanService.upsertPlan).toHaveBeenCalledTimes(1);
      expect(mockUpsertAxeService.upsertAxe).toHaveBeenCalledTimes(2);
      expect(mockPermissionService.isAllowed).toHaveBeenCalledTimes(1);
    });

    it('should create axes in correct hierarchical order (parents before children)', async () => {
      const request = createValidRequest();

      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe
        .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
        .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' }));

      await service.create(request, mockUser, mockTransaction);

      const firstCall = mockUpsertAxeService.upsertAxe.mock.calls[0];
      const secondCall = mockUpsertAxeService.upsertAxe.mock.calls[1];

      expect(firstCall[0].nom).toBe('Axe 1');
      expect(firstCall[0].parent).toBe(1);

      expect(secondCall[0].nom).toBe('Sous-Axe 1');
      expect(secondCall[0].parent).toBe(10);
    });

    it('should fail when fiche creation fails', async () => {
      const request = createValidRequest();

      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe
        .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
        .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' }));

      mockCreateFicheService.createFicheWithAuthorization.mockReset();
      mockCreateFicheService.createFicheWithAuthorization
        .mockResolvedValueOnce(success({ id: 101 }))
        .mockResolvedValueOnce(failure('SERVER_ERROR'));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }
    });

    it('should fail when plan creation fails', async () => {
      const request = createValidRequest();

      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        failure(PlanErrorType.DATABASE_ERROR)
      );

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }

      expect(mockUpsertAxeService.upsertAxe).not.toHaveBeenCalled();
      expect(mockCreateFicheService.createFicheWithAuthorization).not.toHaveBeenCalled();
    });

    it('should fail when axe creation fails', async () => {
      const request = createValidRequest();

      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe.mockResolvedValue(
        failure(PlanErrorType.DATABASE_ERROR)
      );

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }
    });

    it('should handle complex multi-level hierarchy', async () => {
      const request: CreatePlanAggregateInput = {
        collectiviteId: 1,
        nom: 'Complex Plan',
        fiches: [
          {
            axisPath: ['A'],
            fiche: { titre: 'F1', pilotes: [], referents: [] },
          },
          {
            axisPath: ['A', 'A1'],
            fiche: { titre: 'F2', pilotes: [], referents: [] },
          },
          {
            axisPath: ['A', 'A1', 'A1a'],
            fiche: { titre: 'F3', pilotes: [], referents: [] },
          },
          {
            axisPath: ['A', 'A2'],
            fiche: { titre: 'F4', pilotes: [], referents: [] },
          },
          {
            axisPath: ['B'],
            fiche: { titre: 'F5', pilotes: [], referents: [] },
          },
        ],
      };

      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Complex Plan' })
      );

      let axeIdCounter = 10;
      mockUpsertAxeService.upsertAxe.mockImplementation(async () =>
        success({ id: axeIdCounter++, nom: 'Test' })
      );

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);

      // Should create 5 axes: A, A1, A1a, A2, B
      expect(mockUpsertAxeService.upsertAxe).toHaveBeenCalledTimes(5);

      // Verify hierarchy: A before A1, A1 before A1a
      const axeCalls = mockUpsertAxeService.upsertAxe.mock.calls;
      expect(axeCalls[0][0].nom).toBe('A');
      expect(axeCalls[1][0].nom).toBe('B');
      expect(axeCalls[2][0].nom).toBe('A1');
      expect(axeCalls[3][0].nom).toBe('A2');
      expect(axeCalls[4][0].nom).toBe('A1a');
    });

    it('should handle duplicate axis paths correctly', async () => {
      const request: CreatePlanAggregateInput = {
        collectiviteId: 1,
        nom: 'Plan with Duplicates',
        fiches: [
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'F1', pilotes: [], referents: [] },
          },
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'F2', pilotes: [], referents: [] },
          },
          {
            axisPath: ['Axe 1', 'Sous-Axe 1'],
            fiche: { titre: 'F3', pilotes: [], referents: [] },
          },
        ],
      };

      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe
        .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
        .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' }));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);

      // Should only create 2 unique axes (not 3)
      expect(mockUpsertAxeService.upsertAxe).toHaveBeenCalledTimes(2);
    });

    it('should pass correct parameters to plan creation', async () => {
      const request = createValidRequest();

      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe.mockResolvedValue(
        success({ id: 10, nom: 'Test' })
      );

      await service.create(request, mockUser, mockTransaction);

      expect(mockUpsertPlanService.upsertPlan).toHaveBeenCalledWith(
        {
          collectiviteId: 1,
          nom: 'Mon Plan Test',
          typeId: 1,
          pilotes: [{ userId: 'pilot-1', tagId: null }],
          referents: [{ userId: null, tagId: 100 }],
        },
        mockUser,
        mockTransaction
      );
    });

    it('should catch and handle unexpected errors', async () => {
      const request = createValidRequest();

      mockUpsertPlanService.upsertPlan.mockRejectedValue(
        new Error('Unexpected error')
      );

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }
    });

    it('should create sous-actions with parentId in two passes', async () => {
      const request: CreatePlanAggregateInput = {
        collectiviteId: 1,
        nom: 'Plan avec sous-actions',
        fiches: [
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Action normale', pilotes: [], referents: [] },
          },
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Action parente', pilotes: [], referents: [] },
          },
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Sous-action 1.1', pilotes: [], referents: [] },
            parentActionTitre: 'Action parente',
          },
        ],
      };

      mockUpsertPlanService.upsertPlan.mockResolvedValueOnce(
        success({ id: 1, nom: 'Plan avec sous-actions' })
      );
      mockUpsertAxeService.upsertAxe.mockResolvedValueOnce(
        success({ id: 10, nom: 'Axe 1' })
      );

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);
      // 3 fiches total: 1 normal + 1 parent (dedicated) + 1 sous-action
      expect(mockCreateFicheService.createFicheWithAuthorization).toHaveBeenCalledTimes(3);

      // Le mock alloue les ids dans l'ordre d'appel à createFicheWithAuthorization :
      // 101 (Action normale), 102 (Action parente), 103 (Sous-action 1.1).
      // La sous-action doit pointer sur l'id de "Action parente" = 102.
      const sousActionCall =
        mockCreateFicheService.createFicheWithAuthorization.mock.calls[2][0];
      expect(sousActionCall.fiche.parentId).toBe(102);
    });

    it('should create sous-actions referencing a dedicated parent fiche', async () => {
      const request: CreatePlanAggregateInput = {
        collectiviteId: 1,
        nom: 'Plan dédup',
        fiches: [
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Action parente', pilotes: [], referents: [] },
          },
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Sous-action 1.1', pilotes: [], referents: [] },
            parentActionTitre: 'Action parente',
          },
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Sous-action 1.2', pilotes: [], referents: [] },
            parentActionTitre: 'Action parente',
          },
        ],
      };

      mockUpsertPlanService.upsertPlan.mockResolvedValueOnce(
        success({ id: 1, nom: 'Plan dédup' })
      );
      mockUpsertAxeService.upsertAxe.mockResolvedValueOnce(
        success({ id: 10, nom: 'Axe 1' })
      );

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);
      // 3 fiches: 1 parent + 2 sous-actions
      expect(mockCreateFicheService.createFicheWithAuthorization).toHaveBeenCalledTimes(3);

      // Le mock alloue : 101 (Action parente), 102 (Sous 1.1), 103 (Sous 1.2).
      // Les 2 sous-actions pointent sur la même parente = 101.
      const calls = mockCreateFicheService.createFicheWithAuthorization.mock.calls;
      expect(calls[1][0].fiche.parentId).toBe(101);
      expect(calls[2][0].fiche.parentId).toBe(101);
    });

    it('should create separate parent fiches for sous-actions sharing the same title but in different axis paths', async () => {
      const request: CreatePlanAggregateInput = {
        collectiviteId: 1,
        nom: 'Plan multi-axes',
        fiches: [
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Action parente', pilotes: [], referents: [] },
          },
          {
            axisPath: ['Axe 2'],
            fiche: { titre: 'Action parente', pilotes: [], referents: [] },
          },
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Sous-action A', pilotes: [], referents: [] },
            parentActionTitre: 'Action parente',
          },
          {
            axisPath: ['Axe 2'],
            fiche: { titre: 'Sous-action B', pilotes: [], referents: [] },
            parentActionTitre: 'Action parente',
          },
        ],
      };

      mockUpsertPlanService.upsertPlan.mockResolvedValueOnce(
        success({ id: 1, nom: 'Plan multi-axes' })
      );
      mockUpsertAxeService.upsertAxe
        .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
        .mockResolvedValueOnce(success({ id: 11, nom: 'Axe 2' }));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);
      expect(mockCreateFicheService.createFicheWithAuthorization).toHaveBeenCalledTimes(4);

      // Le mock alloue : 101 (Action parente Axe 1), 102 (Action parente Axe 2),
      // 103 (Sous-action A → axe 1), 104 (Sous-action B → axe 2).
      const calls = mockCreateFicheService.createFicheWithAuthorization.mock.calls;
      expect(calls[2][0].fiche.parentId).toBe(101);
      expect(calls[3][0].fiche.parentId).toBe(102);
    });

    it('should return DATABASE_ERROR when a sous-action creation fails in pass 2', async () => {
      const request: CreatePlanAggregateInput = {
        collectiviteId: 1,
        nom: 'Plan',
        fiches: [
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Action parente', pilotes: [], referents: [] },
          },
          {
            axisPath: ['Axe 1'],
            fiche: { titre: 'Sous-action 1.1', pilotes: [], referents: [] },
            parentActionTitre: 'Action parente',
          },
        ],
      };

      mockUpsertPlanService.upsertPlan.mockResolvedValueOnce(
        success({ id: 1, nom: 'Plan' })
      );
      mockUpsertAxeService.upsertAxe.mockResolvedValueOnce(
        success({ id: 10, nom: 'Axe 1' })
      );

      mockCreateFicheService.createFicheWithAuthorization.mockReset();
      mockCreateFicheService.createFicheWithAuthorization
        .mockResolvedValueOnce(success({ id: 100 }))
        .mockResolvedValueOnce(failure('SERVER_ERROR'));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }
    });

    it('should attach multiple fiches without axes to the plan root without creating any axes', async () => {
      const request: CreatePlanAggregateInput = {
        collectiviteId: 1,
        nom: 'Mon Plan Test',
        typeId: 1,
        pilotes: [{ userId: 'pilot-1', tagId: null }],
        referents: [{ userId: null, tagId: 100 }],
        fiches: [
          {
            axisPath: undefined, // Fiche without axe
            fiche: {
              titre: 'Fiche 1 sans axe',
              pilotes: [],
              referents: [],
            },
          },
          {
            axisPath: undefined, // Another fiche without axe
            fiche: {
              titre: 'Fiche 2 sans axe',
              pilotes: [],
              referents: [],
            },
          },
          {
            axisPath: undefined, // Third fiche without axe
            fiche: {
              titre: 'Fiche 3 sans axe',
              pilotes: [],
              referents: [],
            },
          },
          {
            axisPath: ['Axe 1'], // Fiche with axe
            fiche: {
              titre: 'Fiche 4 avec axe',
              pilotes: [],
              referents: [],
            },
          },
        ],
      };

      mockUpsertPlanService.upsertPlan.mockResolvedValueOnce(
        success({
          id: 100,
          nom: 'Mon Plan Test',
          collectiviteId: 1,
        })
      );

      // Mock axe creation for "Axe 1"
      mockUpsertAxeService.upsertAxe.mockResolvedValueOnce(
        success({ id: 201, nom: 'Axe 1' })
      );

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);

      // One axe should be created for "Axe 1"
      expect(mockUpsertAxeService.upsertAxe).toHaveBeenCalledTimes(1);

      expect(mockCreateFicheService.createFicheWithAuthorization).toHaveBeenCalledTimes(4);
    });

    describe('webhook batching', () => {
      it('envoie un seul webhook batché pour toutes les fiches créées', async () => {
        const request = createValidRequest();

        mockUpsertPlanService.upsertPlan.mockResolvedValue(
          success({ id: 1, nom: 'Mon Plan Test' })
        );
        mockUpsertAxeService.upsertAxe
          .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
          .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' }));

        const refetchedFiches = [
          { id: 101, titre: 'Fiche 1' },
          { id: 102, titre: 'Fiche 2' },
        ];
        mockListFichesService.listFichesQuery.mockResolvedValueOnce({
          data: refetchedFiches,
          count: refetchedFiches.length,
        });

        const result = await service.create(
          request,
          mockUser,
          mockTransaction
        );

        expect(result.success).toBe(true);
        expect(
          mockWebhookService.sendWebhookNotifications
        ).toHaveBeenCalledTimes(1);
        expect(
          mockWebhookService.sendWebhookNotifications
        ).toHaveBeenCalledWith(ApplicationSousScopesEnum.FICHES, [
          { entityId: '101', payload: refetchedFiches[0] },
          { entityId: '102', payload: refetchedFiches[1] },
        ]);
      });

      it("ne casse pas l'import si l'envoi du webhook échoue", async () => {
        const request = createValidRequest();

        mockUpsertPlanService.upsertPlan.mockResolvedValue(
          success({ id: 1, nom: 'Mon Plan Test' })
        );
        mockUpsertAxeService.upsertAxe
          .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
          .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' }));

        mockListFichesService.listFichesQuery.mockResolvedValueOnce({
          data: [{ id: 101, titre: 'Fiche 1' }],
          count: 1,
        });
        mockWebhookService.sendWebhookNotifications.mockRejectedValueOnce(
          new Error('webhook endpoint down')
        );

        const result = await service.create(
          request,
          mockUser,
          mockTransaction
        );

        expect(result.success).toBe(true);
      });
    });
  });
});
