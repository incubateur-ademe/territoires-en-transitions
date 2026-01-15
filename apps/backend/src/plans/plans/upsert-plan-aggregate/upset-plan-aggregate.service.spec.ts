import {
  AuthenticatedUser,
  AuthRole,
} from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlanAggregateService } from './upsert-plan-aggregate.service';
import { PlanAggregateCreationInput } from './upsert-plan-aggregate.types';

describe('PlanAggregateService', () => {
  let service: PlanAggregateService;
  let mockUpsertAxeService: any;
  let mockUpsertPlanService: any;
  let mockFicheService: any;
  let mockTransaction: Transaction;
  let mockUser: AuthenticatedUser;

  beforeEach(() => {
    // Mock UpsertAxeService
    mockUpsertAxeService = {
      upsertAxe: vi.fn(),
    };

    // Mock UpsertPlanService
    mockUpsertPlanService = {
      upsertPlan: vi.fn(),
    };

    // Mock FicheService
    mockFicheService = {
      create: vi.fn(),
      linkFicheToAxe: vi.fn(),
    };

    // Mock Transaction
    mockTransaction = {} as Transaction;

    // Mock User
    mockUser = {
      id: 'user-123',
      role: AuthRole.AUTHENTICATED,
      isAnonymous: false,
      jwtPayload: { role: AuthRole.AUTHENTICATED },
    };

    service = new PlanAggregateService(
      mockFicheService,
      mockUpsertAxeService,
      mockUpsertPlanService
    );
  });

  describe('create', () => {
    const createValidRequest = (): PlanAggregateCreationInput => ({
      collectiviteId: 1,
      nom: 'Mon Plan Test',
      typeId: 1,
      pilotes: [{ userId: 'pilot-1', tagId: null }],
      referents: [{ userId: null, tagId: 100 }],
      fiches: [
        {
          axisPath: ['Axe 1'],
          fiche: {
            collectiviteId: 1,
            titre: 'Fiche 1',
            pilotes: [],
            referents: [],
          },
        },
        {
          axisPath: ['Axe 1', 'Sous-Axe 1'],
          fiche: {
            collectiviteId: 1,
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
      mockFicheService.create
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

      // Mock fiche linking
      mockFicheService.linkFicheToAxe.mockResolvedValue(success(true));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1); // Plan ID
      }

      // Verify creation order
      expect(mockFicheService.create).toHaveBeenCalledTimes(2);
      expect(mockUpsertPlanService.upsertPlan).toHaveBeenCalledTimes(1);
      expect(mockUpsertAxeService.upsertAxe).toHaveBeenCalledTimes(2);
      expect(mockFicheService.linkFicheToAxe).toHaveBeenCalledTimes(2);
    });

    it('should create axes in correct hierarchical order (parents before children)', async () => {
      const request = createValidRequest();

      mockFicheService.create.mockResolvedValue(success(101));
      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe
        .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
        .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' }));
      mockFicheService.linkFicheToAxe.mockResolvedValue(success(true));

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
      expect(mockFicheService.create).not.toHaveBeenCalled();
      expect(mockUpsertPlanService.upsertPlan).not.toHaveBeenCalled();
    });

    it('should fail when fiche creation fails', async () => {
      const request = createValidRequest();

      mockFicheService.create
        .mockResolvedValueOnce(success(101))
        .mockResolvedValueOnce(failure(PlanErrorType.DATABASE_ERROR));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }

      // Plan should not be created if fiche creation fails
      expect(mockUpsertPlanService.upsertPlan).not.toHaveBeenCalled();
    });

    it('should fail when plan creation fails', async () => {
      const request = createValidRequest();

      mockFicheService.create.mockResolvedValue(success(101));
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

      mockFicheService.create.mockResolvedValue(success(101));
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

      // Fiche linking should not be attempted if axe creation fails
      expect(mockFicheService.linkFicheToAxe).not.toHaveBeenCalled();
    });

    it('should fail when fiche linking fails', async () => {
      const request = createValidRequest();

      mockFicheService.create.mockResolvedValue(success(101));
      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe.mockResolvedValue(
        success({ id: 10, nom: 'Axe 1' })
      );
      mockFicheService.linkFicheToAxe.mockResolvedValue(
        failure(PlanErrorType.DATABASE_ERROR)
      );

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }
    });

    it('should link fiches without axes directly to the plan', async () => {
      const request: PlanAggregateCreationRequest = {
        collectiviteId: 1,
        nom: 'Plan with No Axes Fiches',
        fiches: [
          {
            axisPath: [],
            fiche: { collectiviteId: 1, titre: 'Fiche sans axe' } as any,
          },
          {
            axisPath: ['Axe 1'],
            fiche: { collectiviteId: 1, titre: 'Fiche avec axe' } as any,
          },
        ],
      };

      mockFicheService.create
        .mockResolvedValueOnce(success(101)) // Fiche without axes
        .mockResolvedValueOnce(success(102)); // Fiche with axes

      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Plan with No Axes Fiches' })
      );

      mockUpsertAxeService.upsertAxe.mockResolvedValue(
        success({ id: 10, nom: 'Axe 1' })
      );

      mockFicheService.linkFicheToAxe.mockResolvedValue(success(true));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);

      // Verify fiche without axes is linked to plan ID (1)
      expect(mockFicheService.linkFicheToAxe).toHaveBeenCalledWith(
        101, // Fiche ID
        1, // Plan ID (not axe ID)
        mockTransaction
      );

      // Verify fiche with axes is linked to axe ID (10)
      expect(mockFicheService.linkFicheToAxe).toHaveBeenCalledWith(
        102, // Fiche ID
        10, // Axe ID
        mockTransaction
      );

      // Should only create 1 axe (not the empty path)
      expect(mockUpsertAxeService.upsertAxe).toHaveBeenCalledTimes(1);
    });

    it('should handle complex multi-level hierarchy', async () => {
      const request: PlanAggregateCreationRequest = {
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

      mockFicheService.create.mockResolvedValue(success(101));
      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Complex Plan' })
      );

      let axeIdCounter = 10;
      mockUpsertAxeService.upsertAxe.mockImplementation(async () =>
        success({ id: axeIdCounter++, nom: 'Test' })
      );

      mockFicheService.linkFicheToAxe.mockResolvedValue(success(true));

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
      const request: PlanAggregateCreationRequest = {
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

      mockFicheService.create.mockResolvedValue(success(101));
      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe
        .mockResolvedValueOnce(success({ id: 10, nom: 'Axe 1' }))
        .mockResolvedValueOnce(success({ id: 11, nom: 'Sous-Axe 1' }));
      mockFicheService.linkFicheToAxe.mockResolvedValue(success(true));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(true);

      // Should only create 2 unique axes (not 3)
      expect(mockUpsertAxeService.upsertAxe).toHaveBeenCalledTimes(2);

      // But should link all 3 fiches
      expect(mockFicheService.linkFicheToAxe).toHaveBeenCalledTimes(3);
    });

    it('should pass correct parameters to plan creation', async () => {
      const request = createValidRequest();

      mockFicheService.create.mockResolvedValue(success(101));
      mockUpsertPlanService.upsertPlan.mockResolvedValue(
        success({ id: 1, nom: 'Test' })
      );
      mockUpsertAxeService.upsertAxe.mockResolvedValue(
        success({ id: 10, nom: 'Test' })
      );
      mockFicheService.linkFicheToAxe.mockResolvedValue(success(true));

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

      mockFicheService.create.mockRejectedValue(new Error('Unexpected error'));

      const result = await service.create(request, mockUser, mockTransaction);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(PlanErrorType.DATABASE_ERROR);
      }
    });
  });
});
