import { PermissionService } from '@/backend/users/authorizations/permission.service';
import {
  AuthenticatedUser,
  AuthRole,
} from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DiscussionDomainService } from '../domain/discussion-domain-service';
import {
  CreateDiscussionRequest,
  DiscussionErrorEnum,
  DiscussionStatutEnum,
} from '../domain/discussion.type';
import { DiscussionApplicationService } from './discussion-application.service';

describe('DiscussionApplicationService', () => {
  let service: DiscussionApplicationService;
  let mockDiscussionDomainService: DiscussionDomainService;
  let mockPermissionService: PermissionService;
  let mockDatabaseService: DatabaseService;
  let mockLogger: Logger;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: AuthRole.AUTHENTICATED,
    isAnonymous: false,
    jwtPayload: {
      role: AuthRole.AUTHENTICATED,
    },
  } as AuthenticatedUser;

  beforeEach(async () => {
    mockDiscussionDomainService = {
      insert: vi.fn(),
      deleteDiscussionMessage: vi.fn(),
      list: vi.fn(),
      updateDiscussion: vi.fn(),
    } as unknown as DiscussionDomainService;

    mockPermissionService = {
      isAllowed: vi.fn(),
    } as unknown as PermissionService;

    mockDatabaseService = {
      db: {
        transaction: vi.fn((callback) => callback({})),
      },
    } as unknown as DatabaseService;

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionApplicationService,
        {
          provide: DiscussionDomainService,
          useValue: mockDiscussionDomainService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<DiscussionApplicationService>(
      DiscussionApplicationService
    );
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

      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
      vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue(
        mockResponse
      );

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
      expect(mockDiscussionDomainService.insert).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user lacks permission', async () => {
      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

      const result = await service.createDiscussion(
        mockDiscussionRequest,
        mockUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockDiscussionDomainService.insert).not.toHaveBeenCalled();
    });
  });

  describe('deleteDiscussionMessage', () => {
    const discussionMessageId = 1;
    const collectiviteId = 1;

    test('should delete a message when user has permission', async () => {
      const mockResponse = { success: true as const, data: undefined };

      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
      vi.mocked(
        mockDiscussionDomainService.deleteDiscussionMessage
      ).mockResolvedValue(mockResponse);

      const result = await service.deleteDiscussionMessage(
        discussionMessageId,
        collectiviteId,
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
        'Collectivité',
        collectiviteId
      );
      expect(
        mockDiscussionDomainService.deleteDiscussionMessage
      ).toHaveBeenCalledWith(discussionMessageId);
      expect(result).toEqual(mockResponse);
    });

    test('should return UNAUTHORIZED when user lacks permission', async () => {
      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

      const result = await service.deleteDiscussionMessage(
        discussionMessageId,
        collectiviteId,
        mockUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(
        mockDiscussionDomainService.deleteDiscussionMessage
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

      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
      vi.mocked(mockDiscussionDomainService.list).mockResolvedValue(
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
      expect(mockDiscussionDomainService.list).toHaveBeenCalledWith(
        collectiviteId,
        referentielId,
        undefined,
        undefined
      );
      expect(result).toEqual(mockResponse);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    test('should return UNAUTHORIZED when user lacks permission', async () => {
      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

      const result = await service.listDiscussionsWithMessages(
        { collectiviteId, referentielId },
        mockUser
      );

      expect(result).toEqual({
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      });
      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockDiscussionDomainService.list).not.toHaveBeenCalled();
    });

    test('should pass filters and options to domain service', async () => {
      const filters = { actionId: 'cae_1.1.1' };
      const options = { limit: 20, page: 1 };
      const mockResponse = {
        success: true as const,
        data: { data: [], count: 0 },
      };

      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
      vi.mocked(mockDiscussionDomainService.list).mockResolvedValue(
        mockResponse
      );

      await service.listDiscussionsWithMessages(
        { collectiviteId, referentielId, filters, options },
        mockUser
      );

      expect(mockDiscussionDomainService.list).toHaveBeenCalledWith(
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

      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
      vi.mocked(mockDiscussionDomainService.updateDiscussion).mockResolvedValue(
        mockResponse
      );

      const result = await service.updateDiscussion(
        discussionId,
        status,
        collectiviteId,
        mockUser
      );

      expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
        mockUser,
        'collectivites.lecture',
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
      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

      const result = await service.updateDiscussion(
        discussionId,
        status,
        collectiviteId,
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

      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
      vi.mocked(mockDiscussionDomainService.updateDiscussion).mockResolvedValue(
        mockResponse
      );

      const result = await service.updateDiscussion(
        discussionId,
        DiscussionStatutEnum.FERME,
        collectiviteId,
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

      vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
      vi.mocked(mockDiscussionDomainService.updateDiscussion).mockResolvedValue(
        mockResponse
      );

      const result = await service.updateDiscussion(
        discussionId,
        DiscussionStatutEnum.OUVERT,
        collectiviteId,
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
