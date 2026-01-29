import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success } from '@tet/backend/utils/result.type';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanErrorType } from '../plans.errors';
import { CreatePlanAggregateService } from './create-plan-aggregate.service';
import { CreatePlanAggregateInput } from './create-plan-aggregate.types';

describe('CreatePlanAggregateService', () => {
  let service: CreatePlanAggregateService;
  let mockUpsertAxeService: any;
  let mockUpsertPlanService: any;
  let mockCreateFicheService: any;
  let mockTransaction: Transaction;
  let mockUser: AuthenticatedUser;

  beforeEach(() => {
    mockUpsertAxeService = {
      upsertAxe: vi.fn(),
    };

    mockUpsertPlanService = {
      upsertPlan: vi.fn(),
    };

    mockCreateFicheService = {
      createFiche: vi.fn(),
    };

    mockTransaction = {} as Transaction;

    mockUser = {
      id: 'user-123',
      role: AuthRole.AUTHENTICATED,
      isAnonymous: false,
      jwtPayload: { role: AuthRole.AUTHENTICATED },
    };

    service = new CreatePlanAggregateService(
      mockCreateFicheService,
      mockUpsertAxeService,
      mockUpsertPlanService
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

      // Mock fiche creation
      mockCreateFicheService.createFiche
        .mockResolvedValueOnce(success(101)) // Fiche 1
        .mockResolvedValueOnce(success(102)); // Fiche 2

      // Mock plan creation
      mockUpsertPlanService.upsertPlan.mockResolvedValueOnce(
        success({ id: 1, nom: 'Mon Plan Test' })
      );

      // Mock axes creation
      mockUpsertAxeService.upsertAxe
        .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' })) // Axe 1
        .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' })); // Sous-Axe 1

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1); // Plan ID
      }

      // Verify creation order
      expect(mockCreateFicheService.createFiche).toHaveBeenCalledTimes(2);
      expect(mockUpsertPlanService.upsertPlan).toHaveBeenCalledTimes(1);
      expect(mockUpsertAxeService.upsertAxe).toHaveBeenCalledTimes(2);
    });

    it('should create axes in correct hierarchical order (parents before children)', async () => {
      const request = createValidRequest();

      mockCreateFicheService.createFiche.mockResolvedValue(success(101));
      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe
        .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
        .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' }));

      await service.create(request, mockUser, mockTransaction);

      // Verify Axe 1 is created before Sous-Axe 1
      const firstCall = mockUpsertAxeService.upsertAxe.mock.calls[0];
      const secondCall = mockUpsertAxeService.upsertAxe.mock.calls[1];

      expect(firstCall[0].nom).toBe('Axe 1');
      expect(firstCall[0].parent).toBe(1); // Parent is plan (root)

      expect(secondCall[0].nom).toBe('Sous-Axe 1');
      expect(secondCall[0].parent).toBe(10); // Parent is Axe 1
    });

    it('should fail validation when plan name is empty', async () => {
      const request = createValidRequest();
      request.nom = '';

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.INVALID_DATA);
      }

      // No service calls should have been made
      expect(mockCreateFicheService.createFiche).not.toHaveBeenCalled();
      expect(mockUpsertPlanService.upsertPlan).not.toHaveBeenCalled();
    });

    it('should fail when fiche creation fails', async () => {
      const request = createValidRequest();

      mockCreateFicheService.createFiche
        .mockResolvedValueOnce(success(101))
        .mockResolvedValueOnce(failure(PlanErrorType.DATABASE_ERROR));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }
    });

    it('should fail when plan creation fails', async () => {
      const request = createValidRequest();

      mockCreateFicheService.createFiche.mockResolvedValue(success(101));
      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        failure(PlanErrorType.DATABASE_ERROR)
      );

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }

      // Axes should not be created if plan creation fails
      expect(mockUpsertAxeService.upsertAxe).not.toHaveBeenCalled();
    });

    it('should fail when axe creation fails', async () => {
      const request = createValidRequest();

      mockCreateFicheService.createFiche.mockResolvedValue(success(101));
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
          { axisPath: ['A'], fiche: { collectiviteId: 1, titre: 'F1' } as any },
          {
            axisPath: ['A', 'A1'],
            fiche: { collectiviteId: 1, titre: 'F2' } as any,
          },
          {
            axisPath: ['A', 'A1', 'A1a'],
            fiche: { collectiviteId: 1, titre: 'F3' } as any,
          },
          {
            axisPath: ['A', 'A2'],
            fiche: { collectiviteId: 1, titre: 'F4' } as any,
          },
          { axisPath: ['B'], fiche: { collectiviteId: 1, titre: 'F5' } as any },
        ],
      };

      mockCreateFicheService.createFiche.mockResolvedValue(success(101));
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
            fiche: { collectiviteId: 1, titre: 'F1' } as any,
          },
          {
            axisPath: ['Axe 1'],
            fiche: { collectiviteId: 1, titre: 'F2' } as any,
          },
          {
            axisPath: ['Axe 1', 'Sous-Axe 1'],
            fiche: { collectiviteId: 1, titre: 'F3' } as any,
          },
        ],
      };

      mockCreateFicheService.createFiche.mockResolvedValue(success(101));
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

      mockCreateFicheService.createFiche.mockResolvedValue(success(101));
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

      mockCreateFicheService.createFiche.mockRejectedValue(
        new Error('Unexpected error')
      );

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

      // Mock all 4 fiche creations
      mockCreateFicheService.createFiche
        .mockResolvedValueOnce(success({ id: 1 }))
        .mockResolvedValueOnce(success({ id: 2 }))
        .mockResolvedValueOnce(success({ id: 3 }))
        .mockResolvedValueOnce(success({ id: 4 }));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);

      // One axe should be created for "Axe 1"
      expect(mockUpsertAxeService.upsertAxe).toHaveBeenCalledTimes(1);

      expect(mockCreateFicheService.createFiche).toHaveBeenCalledTimes(4);
    });
  });
});
