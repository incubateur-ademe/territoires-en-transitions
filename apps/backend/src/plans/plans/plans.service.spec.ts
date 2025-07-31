import UpdateFicheService from '@/backend/plans/fiches/update-fiche/update-fiche.service';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import {
  AuthenticatedUser,
  AuthRole,
} from '@/backend/users/models/auth.models';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AxeType } from '../fiches/shared/models/axe.table';
import { PlanErrorType } from './plans.errors';
import { PlanService } from './plans.service';

describe('PlanService', () => {
  const mockUser: AuthenticatedUser = {
    id: 'test-user-id',
    role: AuthRole.AUTHENTICATED,
    isAnonymous: false,
    jwtPayload: { role: AuthRole.AUTHENTICATED },
  };

  const mockPlan: AxeType = {
    id: 1,
    nom: 'Test Plan',
    collectiviteId: 123,
    parent: null,
    plan: null,
    createdAt: '2024-01-01T00:00:00Z',
    modifiedAt: '2024-01-01T00:00:00Z',
    modifiedBy: 'test-user-id',
    typeId: null,
    panierId: null,
  };

  describe('deletePlan', () => {
    const planId = 1;

    describe('successful deletion', () => {
      it('should successfully delete a plan and linked fiches when user has permissions', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: true,
            data: mockPlan,
          }),
          deleteAxeAndChildrenAxes: vi.fn().mockResolvedValue({
            success: true,
            data: { impactedFicheIds: [1, 2, 3] },
          }),
        };

        const mockPermissionService = {
          isAllowed: vi.fn().mockResolvedValue(true),
        };

        const mockUpdateFicheService = {
          deleteFiche: vi.fn().mockResolvedValue({
            success: true,
          }),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: mockUpdateFicheService,
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deletePlan(planId, mockUser);

        expect(result).toEqual({
          success: true,
          data: undefined,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(planId);
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['PLANS.EDITION'],
          ResourceType.COLLECTIVITE,
          mockPlan.collectiviteId,
          true
        );
        expect(
          mockPlansRepository.deleteAxeAndChildrenAxes
        ).toHaveBeenCalledWith(planId);
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledWith(
          1,
          mockUser
        );
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledWith(
          2,
          mockUser
        );
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledWith(
          3,
          mockUser
        );
      });
    });

    describe('plan not found', () => {
      it('should return PLAN_NOT_FOUND error when plan does not exist', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: false,
            error: PlanErrorType.PLAN_NOT_FOUND,
          }),
          deleteAxeAndChildrenAxes: vi.fn(),
        };

        const mockPermissionService = {
          isAllowed: vi.fn(),
        };
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: {},
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deletePlan(planId, mockUser);

        expect(result).toEqual({
          success: false,
          error: PlanErrorType.PLAN_NOT_FOUND,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(planId);
        expect(mockPermissionService.isAllowed).not.toHaveBeenCalled();
        expect(
          mockPlansRepository.deleteAxeAndChildrenAxes
        ).not.toHaveBeenCalled();
      });
    });

    describe('unauthorized access', () => {
      it('should return UNAUTHORIZED error when user lacks permissions', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: true,
            data: mockPlan,
          }),
          deleteAxe: vi.fn(),
        };

        const mockPermissionService = {
          isAllowed: vi.fn().mockResolvedValue(false),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: {},
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deletePlan(planId, mockUser);

        expect(result).toEqual({
          success: false,
          error: PlanErrorType.UNAUTHORIZED,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(planId);
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['PLANS.EDITION'],
          ResourceType.COLLECTIVITE,
          mockPlan.collectiviteId,
          true
        );
        expect(mockPlansRepository.deleteAxe).not.toHaveBeenCalled();
      });
    });

    describe('database error during deletion', () => {
      it('should return database error when deleteAxe fails', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: true,
            data: mockPlan,
          }),
          deleteAxeAndChildrenAxes: vi.fn().mockResolvedValue({
            success: false,
            error: PlanErrorType.DATABASE_ERROR,
          }),
        };

        const mockPermissionService = {
          isAllowed: vi.fn().mockResolvedValue(true),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: {},
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deletePlan(planId, mockUser);

        expect(result).toEqual({
          success: false,
          error: PlanErrorType.DATABASE_ERROR,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(planId);
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['PLANS.EDITION'],
          ResourceType.COLLECTIVITE,
          mockPlan.collectiviteId,
          true
        );
        expect(
          mockPlansRepository.deleteAxeAndChildrenAxes
        ).toHaveBeenCalledWith(planId);
      });
    });
  });

  describe('deleteAxe', () => {
    const axeId = 1;

    describe('successful deletion', () => {
      it('should successfully delete an axe and linked fiches when user has permissions', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: true,
            data: mockPlan,
          }),
          deleteAxeAndChildrenAxes: vi.fn().mockResolvedValue({
            success: true,
            data: { impactedFicheIds: [1, 2, 3] },
          }),
        };

        const mockPermissionService = {
          isAllowed: vi.fn().mockResolvedValue(true),
        };

        const mockUpdateFicheService = {
          deleteFiche: vi.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: mockUpdateFicheService,
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deleteAxe(axeId, mockUser);

        expect(result).toEqual({
          success: true,
          data: undefined,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(axeId);
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['PLANS.EDITION'],
          ResourceType.COLLECTIVITE,
          mockPlan.collectiviteId,
          true
        );
        expect(
          mockPlansRepository.deleteAxeAndChildrenAxes
        ).toHaveBeenCalledWith(axeId);
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledTimes(3);
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledWith(
          1,
          mockUser
        );
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledWith(
          2,
          mockUser
        );
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledWith(
          3,
          mockUser
        );
      });

      it('should successfully delete an axe with no impacted fiches', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: true,
            data: mockPlan,
          }),
          deleteAxeAndChildrenAxes: vi.fn().mockResolvedValue({
            success: true,
            data: { impactedFicheIds: [] },
          }),
        };

        const mockPermissionService = {
          isAllowed: vi.fn().mockResolvedValue(true),
        };

        const mockUpdateFicheService = {
          deleteFiche: vi.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: mockUpdateFicheService,
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deleteAxe(axeId, mockUser);

        expect(result).toEqual({
          success: true,
          data: undefined,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(axeId);
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['PLANS.EDITION'],
          ResourceType.COLLECTIVITE,
          mockPlan.collectiviteId,
          true
        );
        expect(
          mockPlansRepository.deleteAxeAndChildrenAxes
        ).toHaveBeenCalledWith(axeId);
        expect(mockUpdateFicheService.deleteFiche).not.toHaveBeenCalled();
      });
    });

    describe('axe not found', () => {
      it('should return PLAN_NOT_FOUND error when axe does not exist', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: false,
            error: PlanErrorType.PLAN_NOT_FOUND,
          }),
          deleteAxeAndChildrenAxes: vi.fn(),
        };

        const mockPermissionService = {
          isAllowed: vi.fn(),
        };

        const mockUpdateFicheService = {
          deleteFiche: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: mockUpdateFicheService,
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deleteAxe(axeId, mockUser);

        expect(result).toEqual({
          success: false,
          error: PlanErrorType.PLAN_NOT_FOUND,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(axeId);
        expect(mockPermissionService.isAllowed).not.toHaveBeenCalled();
        expect(
          mockPlansRepository.deleteAxeAndChildrenAxes
        ).not.toHaveBeenCalled();
        expect(mockUpdateFicheService.deleteFiche).not.toHaveBeenCalled();
      });
    });

    describe('unauthorized access', () => {
      it('should return UNAUTHORIZED error when user lacks permissions', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: true,
            data: mockPlan,
          }),
          deleteAxeAndChildrenAxes: vi.fn(),
        };

        const mockPermissionService = {
          isAllowed: vi.fn().mockResolvedValue(false),
        };

        const mockUpdateFicheService = {
          deleteFiche: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: mockUpdateFicheService,
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deleteAxe(axeId, mockUser);

        expect(result).toEqual({
          success: false,
          error: PlanErrorType.UNAUTHORIZED,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(axeId);
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['PLANS.EDITION'],
          ResourceType.COLLECTIVITE,
          mockPlan.collectiviteId,
          true
        );
        expect(
          mockPlansRepository.deleteAxeAndChildrenAxes
        ).not.toHaveBeenCalled();
        expect(mockUpdateFicheService.deleteFiche).not.toHaveBeenCalled();
      });
    });

    describe('database error during deletion', () => {
      it('should return database error when deleteAxe fails', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: true,
            data: mockPlan,
          }),
          deleteAxeAndChildrenAxes: vi.fn().mockResolvedValue({
            success: false,
            error: PlanErrorType.DATABASE_ERROR,
          }),
        };

        const mockPermissionService = {
          isAllowed: vi.fn().mockResolvedValue(true),
        };

        const mockUpdateFicheService = {
          deleteFiche: vi.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: mockUpdateFicheService,
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deleteAxe(axeId, mockUser);

        expect(result).toEqual({
          success: false,
          error: PlanErrorType.DATABASE_ERROR,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(axeId);
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['PLANS.EDITION'],
          ResourceType.COLLECTIVITE,
          mockPlan.collectiviteId,
          true
        );
        expect(
          mockPlansRepository.deleteAxeAndChildrenAxes
        ).toHaveBeenCalledWith(axeId);
        expect(mockUpdateFicheService.deleteFiche).not.toHaveBeenCalled();
      });
    });

    describe('fiche deletion errors', () => {
      it('should continue with other fiches when one fiche deletion fails', async () => {
        const mockPlansRepository = {
          findById: vi.fn().mockResolvedValue({
            success: true,
            data: mockPlan,
          }),
          deleteAxeAndChildrenAxes: vi.fn().mockResolvedValue({
            success: true,
            data: { impactedFicheIds: [1, 2, 3] },
          }),
        };

        const mockPermissionService = {
          isAllowed: vi.fn().mockResolvedValue(true),
        };

        const mockUpdateFicheService: Partial<UpdateFicheService> = {
          deleteFiche: vi
            .fn()
            .mockResolvedValueOnce({ success: true })
            .mockResolvedValueOnce({
              success: false,
              error: 'DATABASE_ERROR',
            })
            .mockResolvedValueOnce({ success: true }),
        };

        const module: TestingModule = await Test.createTestingModule({
          providers: [
            PlanService,
            {
              provide: 'PlansRepositoryInterface',
              useValue: mockPlansRepository,
            },
            {
              provide: PermissionService,
              useValue: mockPermissionService,
            },
            {
              provide: UpdateFicheService,
              useValue: mockUpdateFicheService,
            },
          ],
        }).compile();

        const service = module.get<PlanService>(PlanService);

        const result = await service.deleteAxe(axeId, mockUser);

        expect(result).toEqual({
          success: true,
          data: undefined,
        });
        expect(mockPlansRepository.findById).toHaveBeenCalledWith(axeId);
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['PLANS.EDITION'],
          ResourceType.COLLECTIVITE,
          mockPlan.collectiviteId,
          true
        );
        expect(
          mockPlansRepository.deleteAxeAndChildrenAxes
        ).toHaveBeenCalledWith(axeId);
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledTimes(3);
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledWith(
          1,
          mockUser
        );
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledWith(
          2,
          mockUser
        );
        expect(mockUpdateFicheService.deleteFiche).toHaveBeenCalledWith(
          3,
          mockUser
        );
      });
    });
  });
});
