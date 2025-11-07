import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { UserRole } from '@/backend/users/authorizations/roles/role.enum';
import { RoleService } from '@/backend/users/authorizations/roles/role.service';
import { AuthRole, AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DiscussionDomainService } from '../domain/discussion-domain-service';
import { DiscussionErrorEnum } from '../domain/discussion.errors';
import { DiscussionStatutEnum } from '../domain/discussion.types';
import { ListDiscussionService } from '../domain/list-discussion-service';
import { CreateDiscussionRequest } from '../presentation/discussion.schemas';
import { DiscussionApplicationService } from './discussion-application.service';

describe('DiscussionApplicationService', () => {
  let service: DiscussionApplicationService;
  let mockDiscussionDomainService: Partial<DiscussionDomainService>;
  let mockListDiscussionService: Partial<ListDiscussionService>;
  let mockPermissionService: Partial<PermissionService>;
  let mockRoleService: Partial<RoleService>;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockLogger: Partial<Logger>;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: AuthRole.AUTHENTICATED,
    isAnonymous: false,
    jwtPayload: {
      role: AuthRole.AUTHENTICATED,
    },
  } as AuthUser;

  beforeEach(async () => {
    mockDiscussionDomainService = {
      createOrUpdateDiscussion: vi.fn(),
      deleteDiscussionAndDiscussionMessage: vi.fn(),
      updateDiscussion: vi.fn(),
    };

    mockListDiscussionService = {
      listDiscussions: vi.fn(),
    };

    mockPermissionService = {
      isAllowed: vi.fn(),
      hasSupportRole: vi.fn(),
      hasADEMERole: vi.fn(),
    };

    mockRoleService = {
      getUserRoles: vi.fn(),
    };

    mockDatabaseService = {
      db: {
        transaction: vi.fn((callback) => callback({})),
      },
    } as any;

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionApplicationService,
        {
          provide: DiscussionDomainService,
          useValue: mockDiscussionDomainService as DiscussionDomainService,
        },
        {
          provide: ListDiscussionService,
          useValue: mockListDiscussionService as ListDiscussionService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService as PermissionService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService as DatabaseService,
        },
        {
          provide: RoleService,
          useValue: mockRoleService as RoleService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<DiscussionApplicationService>(
      DiscussionApplicationService
    ) as DiscussionApplicationService;
  });

  describe('createDiscussion', () => {
    const mockDiscussionRequest: CreateDiscussionRequest = {
      collectiviteId: 1,
      actionId: 'cae_1.1.1',
      message: 'Test message',
    };

    test('should create a discussion when user has permission', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          id: 1,
          messageId: 1,
          collectiviteId: 1,
          actionId: 'cae_1.1.1',
          message: 'Test message',
          status: 'ouvert',
          createdBy: 'user-123',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      };

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([]);
      vi.mocked(
        mockDiscussionDomainService.createOrUpdateDiscussion
      )?.mockResolvedValue(mockResponse);

      const result = await service.createDiscussion(
        mockDiscussionRequest,
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
        'Collectivité',
        1
      );
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(
        mockUser,
        'Collectivité',
        1
      );
      expect(
        mockDiscussionDomainService.createOrUpdateDiscussion
      ).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user lacks permission', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(false);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([]);

      const result = await service.createDiscussion(
        mockDiscussionRequest,
        mockUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.createOrUpdateDiscussion
      ).not.toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user has Support role', async () => {
      const supportUser: AuthUser = mockUser;

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([
        UserRole.SUPPORT,
      ]);

      const result = await service.createDiscussion(
        mockDiscussionRequest,
        supportUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        supportUser,
        'collectivites.lecture',
        'Collectivité',
        1
      );
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(
        supportUser,
        'Collectivité',
        1
      );
      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.createOrUpdateDiscussion
      ).not.toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user has ADEME role', async () => {
      const ademeUser: AuthUser = mockUser;

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([
        UserRole.ADEME,
      ]);

      const result = await service.createDiscussion(
        mockDiscussionRequest,
        ademeUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        ademeUser,
        'collectivites.lecture',
        'Collectivité',
        1
      );
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(
        ademeUser,
        'Collectivité',
        1
      );
      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.createOrUpdateDiscussion
      ).not.toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user has both Support and ADEME roles', async () => {
      const dualRoleUser: AuthUser = mockUser;

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([
        UserRole.SUPPORT,
        UserRole.ADEME,
      ]);

      const result = await service.createDiscussion(
        mockDiscussionRequest,
        dualRoleUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.createOrUpdateDiscussion
      ).not.toHaveBeenCalled();
    });
  });

  describe('deleteDiscussionAndDiscussionMessage', () => {
    const discussionId = 1;
    const collectiviteId = 1;

    test('should delete a message when user has permission', async () => {
      const mockResponse = { success: true as const, data: undefined };

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([]);
      vi.mocked(
        mockDiscussionDomainService.deleteDiscussionAndDiscussionMessage
      )?.mockResolvedValue(mockResponse);

      const result = await service.deleteDiscussionAndDiscussionMessage(
        { discussionId, collectiviteId },
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
        'Collectivité',
        collectiviteId
      );
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(
        mockUser,
        'Collectivité',
        collectiviteId
      );
      expect(
        mockDiscussionDomainService.deleteDiscussionAndDiscussionMessage
      ).toHaveBeenCalledWith(discussionId);
      expect(result).toEqual(mockResponse);
    });

    test('should return UNAUTHORIZED when user lacks permission', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(false);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([]);

      const result = await service.deleteDiscussionAndDiscussionMessage(
        { discussionId, collectiviteId },
        mockUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.deleteDiscussionAndDiscussionMessage
      ).not.toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user has Support role', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([
        UserRole.SUPPORT,
      ]);

      const result = await service.deleteDiscussionAndDiscussionMessage(
        { discussionId, collectiviteId },
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
        'Collectivité',
        collectiviteId
      );
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(
        mockUser,
        'Collectivité',
        collectiviteId
      );
      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.deleteDiscussionAndDiscussionMessage
      ).not.toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user has ADEME role', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([
        UserRole.ADEME,
      ]);

      const result = await service.deleteDiscussionAndDiscussionMessage(
        { discussionId, collectiviteId },
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
        'Collectivité',
        collectiviteId
      );
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(
        mockUser,
        'Collectivité',
        collectiviteId
      );
      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.deleteDiscussionAndDiscussionMessage
      ).not.toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user has both Support and ADEME roles', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([
        UserRole.SUPPORT,
        UserRole.ADEME,
      ]);

      const result = await service.deleteDiscussionAndDiscussionMessage(
        { discussionId, collectiviteId },
        mockUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.deleteDiscussionAndDiscussionMessage
      ).not.toHaveBeenCalled();
    });
  });

  describe('listDiscussionsWithMessages', () => {
    const collectiviteId = 1;
    const referentielId = 'cae' as const;

    test('should list discussions when user has permission', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          data: [
            {
              id: 1,
              collectiviteId: 1,
              actionId: 'cae_1.1.1',
              actionNom: 'Test Action',
              actionIdentifiant: '1.1.1',
              status: 'ouvert',
              createdBy: 'user-123',
              createdAt: '2025-01-01T00:00:00.000Z',
              modifiedAt: '2025-01-01T00:00:00.000Z',
              messages: [
                {
                  id: 1,
                  discussionId: 1,
                  message: 'Test message',
                  createdBy: 'user-123',
                  createdAt: '2025-01-01T00:00:00.000Z',
                  createdByNom: 'Test User',
                },
              ],
            },
          ],
          count: 1,
        },
      };

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockListDiscussionService.listDiscussions)?.mockResolvedValue(
        mockResponse
      );

      const result = await service.listDiscussionsWithMessages(
        { collectiviteId, referentielId },
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
        'Collectivité',
        collectiviteId
      );
      expect(mockListDiscussionService.listDiscussions).toHaveBeenCalledWith(
        collectiviteId,
        referentielId,
        undefined,
        undefined
      );
      expect(result).toEqual(mockResponse);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user lacks permission', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(false);

      const result = await service.listDiscussionsWithMessages(
        { collectiviteId, referentielId },
        mockUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockListDiscussionService.listDiscussions).not.toHaveBeenCalled();
    });

    test('should pass filters and options to list discussion service', async () => {
      const filters = { actionId: 'cae_1.1.1' };
      const options = { limit: 20, page: 1 };
      const mockResponse = {
        success: true as const,
        data: { data: [], count: 0 },
      };

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockListDiscussionService.listDiscussions)?.mockResolvedValue(
        mockResponse
      );

      await service.listDiscussionsWithMessages(
        { collectiviteId, referentielId, filters, options },
        mockUser
      );

      expect(mockListDiscussionService.listDiscussions).toHaveBeenCalledWith(
        collectiviteId,
        referentielId,
        filters,
        options
      );
    });
  });

  describe('updateDiscussion', () => {
    const discussionId = 1;
    const collectiviteId = 1;
    const status = DiscussionStatutEnum.FERME;

    test('should update discussion status when user has permission', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          id: discussionId,
          collectiviteId,
          actionId: 'cae_1.1.1',
          status: DiscussionStatutEnum.FERME,
          createdBy: 'user-123',
          createdAt: '2025-01-01T00:00:00.000Z',
          modifiedAt: '2025-01-01T00:00:00.000Z',
        },
      };

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([]);
      vi.mocked(
        mockDiscussionDomainService.updateDiscussion
      )?.mockResolvedValue(mockResponse);

      const result = await service.updateDiscussion(
        { discussionId, status, collectiviteId },
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
        'Collectivité',
        collectiviteId
      );
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(
        mockUser,
        'Collectivité',
        collectiviteId
      );
      expect(mockDiscussionDomainService.updateDiscussion).toHaveBeenCalledWith(
        discussionId,
        status
      );
      expect(result).toEqual(mockResponse);
    });

    test('should return UNAUTHORIZED when user lacks permission', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(false);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([]);

      const result = await service.updateDiscussion(
        { discussionId, status, collectiviteId },
        mockUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.updateDiscussion
      ).not.toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user has Support role', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([
        UserRole.SUPPORT,
      ]);

      const result = await service.updateDiscussion(
        { discussionId, status, collectiviteId },
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
        'Collectivité',
        collectiviteId
      );
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(
        mockUser,
        'Collectivité',
        collectiviteId
      );
      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.updateDiscussion
      ).not.toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user has ADEME role', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([
        UserRole.ADEME,
      ]);

      const result = await service.updateDiscussion(
        { discussionId, status, collectiviteId },
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
        'Collectivité',
        collectiviteId
      );
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(
        mockUser,
        'Collectivité',
        collectiviteId
      );
      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.updateDiscussion
      ).not.toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user has both Support and ADEME roles', async () => {
      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([
        UserRole.SUPPORT,
        UserRole.ADEME,
      ]);

      const result = await service.updateDiscussion(
        { discussionId, status, collectiviteId },
        mockUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.updateDiscussion
      ).not.toHaveBeenCalled();
    });

    test('should handle discussion status change from OUVERT to FERME', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          id: discussionId,
          collectiviteId,
          actionId: 'cae_1.1.1',
          status: DiscussionStatutEnum.FERME,
          createdBy: 'user-123',
          createdAt: '2025-01-01T00:00:00.000Z',
          modifiedAt: '2025-01-01T00:00:00.000Z',
        },
      };

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([]);
      vi.mocked(
        mockDiscussionDomainService.updateDiscussion
      )?.mockResolvedValue(mockResponse);

      const result = await service.updateDiscussion(
        {
          discussionId,
          status: DiscussionStatutEnum.FERME,
          collectiviteId,
        },
        mockUser
      );

      expect(mockDiscussionDomainService.updateDiscussion).toHaveBeenCalledWith(
        discussionId,
        DiscussionStatutEnum.FERME
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).status).toBe(DiscussionStatutEnum.FERME);
      }
    });

    test('should handle discussion status change from FERME to OUVERT', async () => {
      const mockResponse = {
        success: true as const,
        data: {
          id: discussionId,
          collectiviteId,
          actionId: 'cae_1.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'user-123',
          createdAt: '2025-01-01T00:00:00.000Z',
          modifiedAt: '2025-01-01T00:00:00.000Z',
        },
      };

      vi.mocked(mockPermissionService.isAllowed)?.mockResolvedValue(true);
      vi.mocked(mockRoleService.getUserRoles)?.mockResolvedValue([]);
      vi.mocked(
        mockDiscussionDomainService.updateDiscussion
      )?.mockResolvedValue(mockResponse);

      const result = await service.updateDiscussion(
        {
          discussionId,
          status: DiscussionStatutEnum.OUVERT,
          collectiviteId,
        },
        mockUser
      );

      expect(mockDiscussionDomainService.updateDiscussion).toHaveBeenCalledWith(
        discussionId,
        DiscussionStatutEnum.OUVERT
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).status).toBe(DiscussionStatutEnum.OUVERT);
      }
    });
  });
});
