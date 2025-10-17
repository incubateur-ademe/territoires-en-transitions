import {
  AuthenticatedUser,
  AuthRole,
} from '@/backend/users/models/auth.models';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DiscussionApplicationService } from '../application/discussion-application.service';
import {
  CreateDiscussionResponse,
  DiscussionError,
  DiscussionErrorEnum,
  Result,
} from '../domain/discussion.type';
import { DiscussionRouter } from './discussion.router';

describe('DiscussionRouter', () => {
  let discussionRouter: DiscussionRouter;
  let mockDiscussionApplicationService: DiscussionApplicationService;
  let mockTrpcService: TrpcService;
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

    // Mock DiscussionApplicationService
    mockDiscussionApplicationService = {
      insertDiscussionMessage: vi.fn(),
    } as any;

    // Mock TrpcService
    mockTrpcService = {
      router: vi.fn((routes) => routes),
      authedProcedure: {
        input: vi.fn().mockReturnThis(),
        mutation: vi.fn((handler) => handler),
      },
    } as any;

    // Create the router with mocks
    discussionRouter = new DiscussionRouter(
      mockTrpcService,
      mockDiscussionApplicationService
    );
  });

  describe('create', () => {
    test('should successfully create a discussion message when service returns success', async () => {
      const input = {
        discussionId: 1,
        collectiviteId: 1,
        actionId: 'test.action.1',
        message: 'This is a test message',
      };

      const expectedData: CreateDiscussionResponse = {
        id: 1,
        messageId: 100,
        collectiviteId: input.collectiviteId,
        actionId: input.actionId,
        message: input.message,
        status: 'ouvert',
        createdBy: mockUser.id,
        createdAt: '2025-10-17T10:00:00.000Z',
      };

      const expectedResponse: Result<
        CreateDiscussionResponse,
        DiscussionError
      > = {
        success: true,
        data: expectedData,
      };

      vi.mocked(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).mockResolvedValue(expectedResponse);

      // Get the mutation handler from the router
      const createHandler = discussionRouter.router.create;

      const result = await createHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).toHaveBeenCalledWith(input, mockUser);
      // Router returns only the data, not the full Result object
      expect(result).toEqual(expectedData);
    });

    test('should throw FORBIDDEN error when service returns UNAUTHORIZED error', async () => {
      const input = {
        discussionId: 1,
        collectiviteId: 3,
        actionId: 'test.action.1',
        message: 'This message should fail',
      };

      const errorResponse: Result<CreateDiscussionResponse, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };

      vi.mocked(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).mockResolvedValue(errorResponse);

      const createHandler = discussionRouter.router.create;

      await expect(
        createHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await createHandler({
          input,
          ctx: { user: mockUser },
        } as any);
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('FORBIDDEN');
        expect(error.message).toBe(
          "Vous n'avez pas les permissions nécessaires"
        );
      }
    });

    test('should throw INTERNAL_SERVER_ERROR for database errors', async () => {
      const input = {
        discussionId: 1,
        collectiviteId: 1,
        actionId: 'test.action.1',
        message: 'This should trigger a database error',
      };

      const errorResponse: Result<CreateDiscussionResponse, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };

      vi.mocked(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).mockResolvedValue(errorResponse);

      const createHandler = discussionRouter.router.create;

      await expect(
        createHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await createHandler({
          input,
          ctx: { user: mockUser },
        } as any);
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(error.message).toBe(
          "Une erreur de base de données s'est produite"
        );
      }
    });

    test('should throw INTERNAL_SERVER_ERROR for server errors', async () => {
      const input = {
        discussionId: 1,
        collectiviteId: 1,
        actionId: 'test.action.1',
        message: 'This should trigger a server error',
      };

      const errorResponse: Result<CreateDiscussionResponse, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.SERVER_ERROR,
      };

      vi.mocked(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).mockResolvedValue(errorResponse);

      const createHandler = discussionRouter.router.create;

      await expect(
        createHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await createHandler({
          input,
          ctx: { user: mockUser },
        } as any);
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(error.message).toBe("Une erreur serveur s'est produite");
      }
    });

    test('should throw NOT_FOUND error when discussion is not found', async () => {
      const input = {
        discussionId: 999,
        collectiviteId: 1,
        actionId: 'test.action.1',
        message: 'This should trigger a not found error',
      };

      const errorResponse: Result<CreateDiscussionResponse, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.DISCUSSION_NOT_FOUND,
      };

      vi.mocked(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).mockResolvedValue(errorResponse);

      const createHandler = discussionRouter.router.create;

      await expect(
        createHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await createHandler({
          input,
          ctx: { user: mockUser },
        } as any);
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('NOT_FOUND');
        expect(error.message).toBe("Une erreur inattendue s'est produite");
      }
    });

    test('should pass correct parameters to application service', async () => {
      const input = {
        discussionId: 5,
        collectiviteId: 10,
        actionId: 'action.test.123',
        message: 'Specific test message',
      };

      const expectedResponse: Result<
        CreateDiscussionResponse,
        DiscussionError
      > = {
        success: true,
        data: {
          id: 5,
          messageId: 500,
          collectiviteId: input.collectiviteId,
          actionId: input.actionId,
          message: input.message,
          status: 'ouvert',
          createdBy: mockUser.id,
          createdAt: '2025-10-17T10:00:00.000Z',
        },
      };

      vi.mocked(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).mockResolvedValue(expectedResponse);

      const createHandler = discussionRouter.router.create;

      await createHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).toHaveBeenCalledTimes(1);
      expect(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).toHaveBeenCalledWith(input, mockUser);
    });

    test('should return data with correct structure on success', async () => {
      const input = {
        discussionId: 1,
        collectiviteId: 1,
        actionId: 'test.action.1',
        message: 'Test message',
      };

      const expectedData: CreateDiscussionResponse = {
        id: 1,
        messageId: 100,
        collectiviteId: 1,
        actionId: 'test.action.1',
        message: 'Test message',
        status: 'ouvert',
        createdBy: mockUser.id,
        createdAt: '2025-10-17T10:00:00.000Z',
      };

      const expectedResponse: Result<
        CreateDiscussionResponse,
        DiscussionError
      > = {
        success: true,
        data: expectedData,
      };

      vi.mocked(
        mockDiscussionApplicationService.insertDiscussionMessage
      ).mockResolvedValue(expectedResponse);

      const createHandler = discussionRouter.router.create;

      const result = await createHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      // Router returns only the data object
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('messageId');
      expect(result).toHaveProperty('collectiviteId');
      expect(result).toHaveProperty('actionId');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('createdBy');
      expect(result).toHaveProperty('createdAt');
      expect(result).toEqual(expectedData);
    });
  });
});
