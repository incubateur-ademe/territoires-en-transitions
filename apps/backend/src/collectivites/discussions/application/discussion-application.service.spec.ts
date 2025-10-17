import { PermissionService } from '@/backend/users/authorizations/permission.service';
import {
  PermissionOperationEnum,
  ResourceType,
} from '@/backend/users/index-domain';
import {
  AuthenticatedUser,
  AuthRole,
} from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscussionDomainService } from '../domain/discussion-domain-service';
import {
  CreateDiscussionResponse,
  DiscussionErrorEnum,
} from '../domain/discussion.type';
import { DiscussionApplicationService } from './discussion-application.service';

describe('DiscussionApplicationService', () => {
  let service: DiscussionApplicationService;
  let mockDiscussionDomainService: DiscussionDomainService;
  let mockPermissionService: PermissionService;
  let mockDatabaseService: DatabaseService;
  let mockLogger: Logger;
  let mockUser: AuthenticatedUser;

  beforeEach(() => {
    // Create mock user
    mockUser = {
      id: '17440546-f389-4d4f-bfdb-b0c94a1bd0f9',
      role: AuthRole.AUTHENTICATED,
      isAnonymous: false,
      jwtPayload: {
        role: AuthRole.AUTHENTICATED,
      },
    } as AuthenticatedUser;

    // Mock services
    mockDiscussionDomainService = {
      insert: vi.fn(),
      deleteDiscussionMessage: vi.fn(),
      list: vi.fn(),
    } as any;

    mockPermissionService = {
      isAllowed: vi.fn(),
    } as any;

    mockLogger = {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as any;
  });

  describe('insertDiscussionMessage', () => {
    describe('successful insertion', () => {
      it('should successfully insert a discussion message when user has permissions', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const request = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: 'This is a test message',
        };

        const expectedResponse: CreateDiscussionResponse = {
          id: 1,
          messageId: 100,
          collectiviteId: request.collectiviteId,
          actionId: request.actionId,
          message: request.message,
          status: 'ouvert',
          createdBy: mockUser.id,
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.insertDiscussionMessage(request, mockUser);

        expect(result).toEqual({
          success: true,
          data: expectedResponse,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['COLLECTIVITES.LECTURE'],
          ResourceType.COLLECTIVITE,
          request.collectiviteId
        );
        expect(mockDiscussionDomainService.insert).toHaveBeenCalledWith(
          {
            ...request,
            createdBy: mockUser.id,
          },
          {}
        );
        expect(mockTransaction).toHaveBeenCalled();
      });

      it('should handle discussion message with different collectiviteId', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const request = {
          discussionId: 5,
          collectiviteId: 456,
          actionId: 'eci.1.1.1',
          message: 'Different collectivite message',
        };

        const expectedResponse: CreateDiscussionResponse = {
          id: 5,
          messageId: 200,
          collectiviteId: request.collectiviteId,
          actionId: request.actionId,
          message: request.message,
          status: 'ouvert',
          createdBy: mockUser.id,
          createdAt: '2025-10-17T11:00:00.000Z',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.insertDiscussionMessage(request, mockUser);

        expect(result).toEqual({
          success: true,
          data: expectedResponse,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['COLLECTIVITES.LECTURE'],
          ResourceType.COLLECTIVITE,
          request.collectiviteId
        );
      });
    });

    describe('unauthorized access', () => {
      it('should return UNAUTHORIZED error when user lacks permissions', async () => {
        mockDatabaseService = {
          db: {
            transaction: vi.fn(),
          },
        } as any;

        const request = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: 'This message should fail',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

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

        const result = await service.insertDiscussionMessage(request, mockUser);

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.UNAUTHORIZED,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['COLLECTIVITES.LECTURE'],
          ResourceType.COLLECTIVITE,
          request.collectiviteId
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining(
            `Droits insuffisants, l'utilisateur ${mockUser.id} n'a pas l'autorisation create discussion sur la ressource Collectivité ${request.collectiviteId}`
          )
        );
        expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
        expect(mockDiscussionDomainService.insert).not.toHaveBeenCalled();
      });

      it('should log error with correct user and collectivite information on unauthorized access', async () => {
        mockDatabaseService = {
          db: {
            transaction: vi.fn(),
          },
        } as any;

        const request = {
          discussionId: 2,
          collectiviteId: 999,
          actionId: 'cae.2.1.1',
          message: 'Unauthorized message',
        };

        const differentUser: AuthenticatedUser = {
          id: 'different-user-id',
          role: AuthRole.AUTHENTICATED,
          isAnonymous: false,
          jwtPayload: {
            role: AuthRole.AUTHENTICATED,
          },
        } as AuthenticatedUser;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

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

        await service.insertDiscussionMessage(request, differentUser);

        expect(mockLogger.error).toHaveBeenCalledWith(
          `Droits insuffisants, l'utilisateur ${differentUser.id} n'a pas l'autorisation create discussion sur la ressource Collectivité ${request.collectiviteId}`
        );
      });
    });

    describe('database errors', () => {
      it('should return error when domain service returns DATABASE_ERROR', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const request = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: 'This should trigger database error',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });

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

        const result = await service.insertDiscussionMessage(request, mockUser);

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalled();
        expect(mockTransaction).toHaveBeenCalled();
      });
    });

    describe('transaction handling', () => {
      it('should execute operations within a transaction', async () => {
        const mockTransaction = vi.fn();
        const mockTransactionContext = { someContext: 'value' };

        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback(mockTransactionContext)
            ),
          },
        } as any;

        const request = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: 'Transaction test message',
        };

        const expectedResponse: CreateDiscussionResponse = {
          id: 1,
          messageId: 100,
          collectiviteId: request.collectiviteId,
          actionId: request.actionId,
          message: request.message,
          status: 'ouvert',
          createdBy: mockUser.id,
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        await service.insertDiscussionMessage(request, mockUser);

        expect(mockTransaction).toHaveBeenCalled();
        expect(mockDiscussionDomainService.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            discussionId: request.discussionId,
            collectiviteId: request.collectiviteId,
            actionId: request.actionId,
            message: request.message,
            createdBy: mockUser.id,
          }),
          mockTransactionContext
        );
      });

      it('should return error from transaction if domain service fails', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const request = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: 'Transaction failure test',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.SERVER_ERROR,
        });

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

        const result = await service.insertDiscussionMessage(request, mockUser);

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.SERVER_ERROR,
        });
        expect(mockTransaction).toHaveBeenCalled();
      });
    });

    describe('data transformation', () => {
      it('should correctly transform request data with user information', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const request = {
          discussionId: 10,
          collectiviteId: 500,
          actionId: 'cae.3.3.3',
          message: 'Data transformation test',
        };

        const expectedResponse: CreateDiscussionResponse = {
          id: 10,
          messageId: 300,
          collectiviteId: request.collectiviteId,
          actionId: request.actionId,
          message: request.message,
          status: 'ouvert',
          createdBy: mockUser.id,
          createdAt: '2025-10-17T12:00:00.000Z',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        await service.insertDiscussionMessage(request, mockUser);

        expect(mockDiscussionDomainService.insert).toHaveBeenCalledWith(
          {
            discussionId: request.discussionId,
            collectiviteId: request.collectiviteId,
            actionId: request.actionId,
            message: request.message,
            createdBy: mockUser.id,
          },
          {}
        );
      });

      it('should use empty string for createdBy when user.id is undefined', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const userWithoutId: AuthenticatedUser = {
          id: undefined as any,
          role: AuthRole.AUTHENTICATED,
          isAnonymous: false,
          jwtPayload: {
            role: AuthRole.AUTHENTICATED,
          },
        } as AuthenticatedUser;

        const request = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: 'Test message',
        };

        const expectedResponse: CreateDiscussionResponse = {
          id: 1,
          messageId: 100,
          collectiviteId: request.collectiviteId,
          actionId: request.actionId,
          message: request.message,
          status: 'ouvert',
          createdBy: '',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        await service.insertDiscussionMessage(request, userWithoutId);

        expect(mockDiscussionDomainService.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            createdBy: '',
          }),
          {}
        );
      });

      it('should preserve discussionId in the transformed data', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const request = {
          discussionId: 42,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: 'Test message',
        };

        const expectedResponse: CreateDiscussionResponse = {
          id: 42,
          messageId: 100,
          collectiviteId: request.collectiviteId,
          actionId: request.actionId,
          message: request.message,
          status: 'ouvert',
          createdBy: mockUser.id,
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        await service.insertDiscussionMessage(request, mockUser);

        expect(mockDiscussionDomainService.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            discussionId: 42,
          }),
          {}
        );
      });
    });

    describe('edge cases', () => {
      it('should handle long messages correctly', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const longMessage = 'a'.repeat(5000);
        const request = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: longMessage,
        };

        const expectedResponse: CreateDiscussionResponse = {
          id: 1,
          messageId: 100,
          collectiviteId: request.collectiviteId,
          actionId: request.actionId,
          message: longMessage,
          status: 'ouvert',
          createdBy: mockUser.id,
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.insertDiscussionMessage(request, mockUser);

        expect(result).toEqual({
          success: true,
          data: expectedResponse,
        });
        expect(mockDiscussionDomainService.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            message: longMessage,
          }),
          {}
        );
      });

      it('should handle special characters in actionId', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const request = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.2.3_special-chars',
          message: 'Test message',
        };

        const expectedResponse: CreateDiscussionResponse = {
          id: 1,
          messageId: 100,
          collectiviteId: request.collectiviteId,
          actionId: request.actionId,
          message: request.message,
          status: 'ouvert',
          createdBy: mockUser.id,
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.insert).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.insertDiscussionMessage(request, mockUser);

        expect(result).toEqual({
          success: true,
          data: expectedResponse,
        });
      });
    });
  });

  describe('deleteDiscussionMessage', () => {
    describe('successful deletion', () => {
      it('should successfully delete a discussion message when user has permissions', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const discussionMessageId = 100;
        const collectiviteId = 123;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(
          mockDiscussionDomainService.deleteDiscussionMessage
        ).mockResolvedValue({
          success: true,
          data: undefined,
        });

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

        const result = await service.deleteDiscussionMessage(
          discussionMessageId,
          collectiviteId,
          mockUser
        );

        expect(result).toEqual({
          success: true,
          data: undefined,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['COLLECTIVITES.LECTURE'],
          ResourceType.COLLECTIVITE,
          collectiviteId
        );
        expect(
          mockDiscussionDomainService.deleteDiscussionMessage
        ).toHaveBeenCalledWith(discussionMessageId);
        expect(mockTransaction).toHaveBeenCalled();
      });

      it('should handle deletion for different collectiviteId', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const discussionMessageId = 200;
        const collectiviteId = 456;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(
          mockDiscussionDomainService.deleteDiscussionMessage
        ).mockResolvedValue({
          success: true,
          data: undefined,
        });

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

        const result = await service.deleteDiscussionMessage(
          discussionMessageId,
          collectiviteId,
          mockUser
        );

        expect(result).toEqual({
          success: true,
          data: undefined,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['COLLECTIVITES.LECTURE'],
          ResourceType.COLLECTIVITE,
          collectiviteId
        );
      });
    });

    describe('unauthorized access', () => {
      it('should return UNAUTHORIZED error when user lacks permissions', async () => {
        mockDatabaseService = {
          db: {
            transaction: vi.fn(),
          },
        } as any;

        const discussionMessageId = 100;
        const collectiviteId = 123;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

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

        const result = await service.deleteDiscussionMessage(
          discussionMessageId,
          collectiviteId,
          mockUser
        );

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.UNAUTHORIZED,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['COLLECTIVITES.LECTURE'],
          ResourceType.COLLECTIVITE,
          collectiviteId
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining(
            `Droits insuffisants, l'utilisateur ${mockUser.id} n'a pas l'autorisation supprimer le message de discussion sur la ressource Collectivité ${collectiviteId}`
          )
        );
        expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
        expect(
          mockDiscussionDomainService.deleteDiscussionMessage
        ).not.toHaveBeenCalled();
      });

      it('should log error with correct user and collectivite information on unauthorized access', async () => {
        mockDatabaseService = {
          db: {
            transaction: vi.fn(),
          },
        } as any;

        const discussionMessageId = 200;
        const collectiviteId = 999;

        const differentUser: AuthenticatedUser = {
          id: 'different-user-id',
          role: AuthRole.AUTHENTICATED,
          isAnonymous: false,
          jwtPayload: {
            role: AuthRole.AUTHENTICATED,
          },
        } as AuthenticatedUser;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

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

        await service.deleteDiscussionMessage(
          discussionMessageId,
          collectiviteId,
          differentUser
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          `Droits insuffisants, l'utilisateur ${differentUser.id} n'a pas l'autorisation supprimer le message de discussion sur la ressource Collectivité ${collectiviteId}`
        );
      });
    });

    describe('database errors', () => {
      it('should return error when domain service returns DATABASE_ERROR', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const discussionMessageId = 100;
        const collectiviteId = 123;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(
          mockDiscussionDomainService.deleteDiscussionMessage
        ).mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });

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

        const result = await service.deleteDiscussionMessage(
          discussionMessageId,
          collectiviteId,
          mockUser
        );

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalled();
        expect(mockTransaction).toHaveBeenCalled();
      });
    });

    describe('transaction handling', () => {
      it('should execute delete within a transaction', async () => {
        const mockTransaction = vi.fn();
        const mockTransactionContext = { someContext: 'value' };

        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback(mockTransactionContext)
            ),
          },
        } as any;

        const discussionMessageId = 100;
        const collectiviteId = 123;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(
          mockDiscussionDomainService.deleteDiscussionMessage
        ).mockResolvedValue({
          success: true,
          data: undefined,
        });

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

        await service.deleteDiscussionMessage(
          discussionMessageId,
          collectiviteId,
          mockUser
        );

        expect(mockTransaction).toHaveBeenCalled();
        expect(
          mockDiscussionDomainService.deleteDiscussionMessage
        ).toHaveBeenCalledWith(discussionMessageId);
      });
    });
  });

  describe('listDiscussions', () => {
    describe('successful listing', () => {
      it('should successfully list discussions when user has permissions', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'cae' as any;

        const expectedResponse = {
          data: [
            {
              id: 1,
              collectiviteId: 123,
              actionId: 'cae.1.1.1',
              status: 'ouvert',
              createdBy: mockUser.id,
              createdAt: '2025-10-17T10:00:00.000Z',
              messages: [
                {
                  id: 100,
                  discussionId: 1,
                  message: 'Test message',
                  createdBy: mockUser.id,
                  createdAt: '2025-10-17T10:00:00.000Z',
                },
              ],
            },
          ],
          count: 1,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId },
          mockUser
        );

        expect(result).toEqual({
          success: true,
          data: expectedResponse,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['COLLECTIVITES.LECTURE'],
          ResourceType.COLLECTIVITE,
          collectiviteId
        );
        expect(mockDiscussionDomainService.list).toHaveBeenCalledWith(
          collectiviteId,
          referentielId,
          undefined,
          undefined
        );
        expect(mockTransaction).toHaveBeenCalled();
      });

      it('should list discussions with filters', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'cae' as any;
        const filters = {
          status: 'ouvert' as any,
          actionId: 'cae.1.1.1',
        };

        const expectedResponse = {
          data: [
            {
              id: 1,
              collectiviteId: 123,
              actionId: 'cae.1.1.1',
              status: 'ouvert',
              createdBy: mockUser.id,
              createdAt: '2025-10-17T10:00:00.000Z',
              messages: [
                {
                  id: 100,
                  discussionId: 1,
                  message: 'Filtered message',
                  createdBy: mockUser.id,
                  createdAt: '2025-10-17T10:00:00.000Z',
                },
              ],
            },
          ],
          count: 1,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId, filters },
          mockUser
        );

        expect(result).toEqual({
          success: true,
          data: expectedResponse,
        });
        expect(mockDiscussionDomainService.list).toHaveBeenCalledWith(
          collectiviteId,
          referentielId,
          filters,
          undefined
        );
      });

      it('should list discussions with pagination options', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'eci' as any;
        const options = {
          page: 1,
          limit: 10,
        } as any;

        const expectedResponse = {
          data: [
            {
              id: 1,
              collectiviteId: 123,
              actionId: 'eci.1.1.1',
              status: 'ouvert',
              createdBy: mockUser.id,
              createdAt: '2025-10-17T10:00:00.000Z',
              messages: [
                {
                  id: 100,
                  discussionId: 1,
                  message: 'Paginated message',
                  createdBy: mockUser.id,
                  createdAt: '2025-10-17T10:00:00.000Z',
                },
              ],
            },
          ],
          count: 1,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId, options },
          mockUser
        );

        expect(result).toEqual({
          success: true,
          data: expectedResponse,
        });
        expect(mockDiscussionDomainService.list).toHaveBeenCalledWith(
          collectiviteId,
          referentielId,
          undefined,
          options
        );
      });

      it('should list discussions with both filters and options', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 456;
        const referentielId = 'cae' as any;
        const filters = {
          status: 'ferme' as any,
        };
        const options = {
          page: 2,
          limit: 5,
          sort: [{ field: 'created_at', direction: 'desc' }],
        } as any;

        const expectedResponse = {
          data: [
            {
              id: 2,
              collectiviteId: 456,
              actionId: 'cae.2.1.1',
              status: 'ferme',
              createdBy: mockUser.id,
              createdAt: '2025-10-17T11:00:00.000Z',
              messages: [
                {
                  id: 200,
                  discussionId: 2,
                  message: 'Closed discussion message',
                  createdBy: mockUser.id,
                  createdAt: '2025-10-17T11:00:00.000Z',
                },
              ],
            },
          ],
          count: 1,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId, filters, options },
          mockUser
        );

        expect(result).toEqual({
          success: true,
          data: expectedResponse,
        });
        expect(mockDiscussionDomainService.list).toHaveBeenCalledWith(
          collectiviteId,
          referentielId,
          filters,
          options
        );
      });

      it('should handle empty discussion list', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'cae' as any;

        const expectedResponse = {
          data: [],
          count: 0,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId },
          mockUser
        );

        expect(result).toEqual({
          success: true,
          data: expectedResponse,
        });
        expect(result.success && result.data.count).toBe(0);
      });
    });

    describe('unauthorized access', () => {
      it('should return UNAUTHORIZED error when user lacks permissions', async () => {
        mockDatabaseService = {
          db: {
            transaction: vi.fn(),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'cae' as any;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

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

        const result = await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId },
          mockUser
        );

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.UNAUTHORIZED,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalledWith(
          mockUser,
          PermissionOperationEnum['COLLECTIVITES.LECTURE'],
          ResourceType.COLLECTIVITE,
          collectiviteId
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining(
            `Droits insuffisants, l'utilisateur ${mockUser.id} n'a pas l'autorisation lister les discussions sur la ressource Collectivité ${collectiviteId}`
          )
        );
        expect(mockDatabaseService.db.transaction).not.toHaveBeenCalled();
        expect(mockDiscussionDomainService.list).not.toHaveBeenCalled();
      });

      it('should log error with correct user and collectivite information on unauthorized access', async () => {
        mockDatabaseService = {
          db: {
            transaction: vi.fn(),
          },
        } as any;

        const collectiviteId = 999;
        const referentielId = 'eci' as any;

        const differentUser: AuthenticatedUser = {
          id: 'different-user-id',
          role: AuthRole.AUTHENTICATED,
          isAnonymous: false,
          jwtPayload: {
            role: AuthRole.AUTHENTICATED,
          },
        } as AuthenticatedUser;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(false);

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

        await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId },
          differentUser
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          `Droits insuffisants, l'utilisateur ${differentUser.id} n'a pas l'autorisation lister les discussions sur la ressource Collectivité ${collectiviteId}`
        );
      });
    });

    describe('database errors', () => {
      it('should return error when domain service returns DATABASE_ERROR', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'cae' as any;

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });

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

        const result = await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId },
          mockUser
        );

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });
        expect(mockPermissionService.isAllowed).toHaveBeenCalled();
        expect(mockTransaction).toHaveBeenCalled();
      });
    });

    describe('transaction handling', () => {
      it('should execute listing within a transaction', async () => {
        const mockTransaction = vi.fn();
        const mockTransactionContext = { someContext: 'value' };

        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback(mockTransactionContext)
            ),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'cae' as any;

        const expectedResponse = {
          data: [],
          count: 0,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId },
          mockUser
        );

        expect(mockTransaction).toHaveBeenCalled();
        expect(mockDiscussionDomainService.list).toHaveBeenCalledWith(
          collectiviteId,
          referentielId,
          undefined,
          undefined
        );
      });
    });

    describe('logging', () => {
      it('should log fetching discussions without filters or options', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'cae' as any;

        const expectedResponse = {
          data: [],
          count: 0,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId },
          mockUser
        );

        expect(mockLogger.log).toHaveBeenCalledWith(
          expect.stringContaining(
            `Fetching detailed discussions for collectivité ${collectiviteId} referentiel ${referentielId}`
          )
        );
      });

      it('should log fetching discussions with filters', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'cae' as any;
        const filters = { status: 'ouvert' as any };

        const expectedResponse = {
          data: [],
          count: 0,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId, filters },
          mockUser
        );

        expect(mockLogger.log).toHaveBeenCalledWith(
          expect.stringContaining(`with filters`)
        );
      });
    });

    describe('different referentiels', () => {
      it('should handle cae referentiel', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 123;
        const referentielId = 'cae' as any;

        const expectedResponse = {
          data: [
            {
              id: 1,
              collectiviteId: 123,
              actionId: 'cae.1.1.1',
              status: 'ouvert',
              createdBy: mockUser.id,
              createdAt: '2025-10-17T10:00:00.000Z',
              messages: [],
            },
          ],
          count: 0,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId },
          mockUser
        );

        expect(result.success).toBe(true);
        expect(mockDiscussionDomainService.list).toHaveBeenCalledWith(
          collectiviteId,
          'cae',
          undefined,
          undefined
        );
      });

      it('should handle eci referentiel', async () => {
        const mockTransaction = vi.fn();
        mockDatabaseService = {
          db: {
            transaction: mockTransaction.mockImplementation(async (callback) =>
              callback({})
            ),
          },
        } as any;

        const collectiviteId = 456;
        const referentielId = 'eci' as any;

        const expectedResponse = {
          data: [
            {
              id: 2,
              collectiviteId: 456,
              actionId: 'eci.1.1.1',
              status: 'ouvert',
              createdBy: mockUser.id,
              createdAt: '2025-10-17T10:00:00.000Z',
              messages: [],
            },
          ],
          count: 0,
        };

        vi.mocked(mockPermissionService.isAllowed).mockResolvedValue(true);
        vi.mocked(mockDiscussionDomainService.list).mockResolvedValue({
          success: true,
          data: expectedResponse,
        });

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

        const result = await service.listDiscussionsWithMessages(
          { collectiviteId, referentielId },
          mockUser
        );

        expect(result.success).toBe(true);
        expect(mockDiscussionDomainService.list).toHaveBeenCalledWith(
          collectiviteId,
          'eci',
          undefined,
          undefined
        );
      });
    });
  });
});
