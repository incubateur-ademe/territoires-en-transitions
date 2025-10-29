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
  Discussion,
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
      createDiscussion: vi.fn(),
      listDiscussionsWithMessages: vi.fn(),
      deleteDiscussionMessage: vi.fn(),
    } as unknown as DiscussionApplicationService;

    // Mock TrpcService
    mockTrpcService = {
      router: vi.fn((routes) => routes),
      authedProcedure: {
        input: vi.fn().mockReturnThis(),
        mutation: vi.fn((handler) => handler),
        query: vi.fn((handler) => handler),
      },
    } as unknown as TrpcService;

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
        mockDiscussionApplicationService.createDiscussion
      ).mockResolvedValue(expectedResponse);

      // Get the mutation handler from the router
      const createHandler = discussionRouter.router.create;

      const result = await createHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(
        mockDiscussionApplicationService.createDiscussion
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
        mockDiscussionApplicationService.createDiscussion
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
        mockDiscussionApplicationService.createDiscussion
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
        mockDiscussionApplicationService.createDiscussion
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
        mockDiscussionApplicationService.createDiscussion
      ).mockResolvedValue(expectedResponse);

      const createHandler = discussionRouter.router.create;

      await createHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(
        mockDiscussionApplicationService.createDiscussion
      ).toHaveBeenCalledTimes(1);
      expect(
        mockDiscussionApplicationService.createDiscussion
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
        mockDiscussionApplicationService.createDiscussion
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

  describe('list', () => {
    test('should successfully list discussions when service returns success', async () => {
      const input = {
        collectiviteId: 1,
        referentielId: 'cae' as const,
        filters: {
          status: 'ouvert' as const,
        },
        options: {
          limit: 10,
          page: 1,
        },
      };

      const expectedData: Discussion = {
        data: [
          {
            id: 1,
            collectiviteId: 1,
            actionId: 'test.action.1',
            status: 'ouvert',
            createdBy: mockUser.id,
            createdAt: '2025-10-17T10:00:00.000Z',
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'First message',
                createdBy: mockUser.id,
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ],
        count: 1,
      };

      const expectedResponse: Result<Discussion, DiscussionError> = {
        success: true,
        data: expectedData,
      };

      vi.mocked(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).mockResolvedValue(expectedResponse);

      const listHandler = discussionRouter.router.list;

      const result = await listHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).toHaveBeenCalledWith(
        {
          collectiviteId: input.collectiviteId,
          referentielId: input.referentielId,
          filters: input.filters,
          options: input.options,
        },
        mockUser
      );
      expect(result).toEqual(expectedData);
    });

    test('should throw FORBIDDEN error when service returns UNAUTHORIZED error', async () => {
      const input = {
        collectiviteId: 3,
        referentielId: 'cae' as const,
      };

      const errorResponse: Result<Discussion, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };

      vi.mocked(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).mockResolvedValue(errorResponse);

      const listHandler = discussionRouter.router.list;

      await expect(
        listHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await listHandler({
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

    test('should throw BAD_REQUEST error when service returns FILTERS_NOT_VALID error', async () => {
      const input = {
        collectiviteId: 1,
        referentielId: 'cae' as const,
        filters: {
          status: 'invalid' as any,
        },
      };

      const errorResponse: Result<Discussion, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.FILTERS_NOT_VALID,
      };

      vi.mocked(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).mockResolvedValue(errorResponse);

      const listHandler = discussionRouter.router.list;

      await expect(
        listHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await listHandler({
          input,
          ctx: { user: mockUser },
        } as any);
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('BAD_REQUEST');
        expect(error.message).toBe('Les filtres fournis ne sont pas valides');
      }
    });

    test('should throw BAD_REQUEST error when service returns    error', async () => {
      const input = {
        collectiviteId: 1,
        referentielId: 'cae' as const,
        options: {
          limit: -1,
        },
      };

      const errorResponse: Result<Discussion, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.OPTIONS_NOT_VALID,
      };

      vi.mocked(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).mockResolvedValue(errorResponse);

      const listHandler = discussionRouter.router.list;

      await expect(
        listHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await listHandler({
          input,
          ctx: { user: mockUser },
        } as any);
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('BAD_REQUEST');
        expect(error.message).toBe('Les options fournies ne sont pas valides');
      }
    });

    test('should throw INTERNAL_SERVER_ERROR for database errors', async () => {
      const input = {
        collectiviteId: 1,
        referentielId: 'cae' as const,
      };

      const errorResponse: Result<Discussion, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };

      vi.mocked(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).mockResolvedValue(errorResponse);

      const listHandler = discussionRouter.router.list;

      await expect(
        listHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await listHandler({
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
        collectiviteId: 1,
        referentielId: 'cae' as const,
      };

      const errorResponse: Result<Discussion, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.SERVER_ERROR,
      };

      vi.mocked(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).mockResolvedValue(errorResponse);

      const listHandler = discussionRouter.router.list;

      await expect(
        listHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await listHandler({
          input,
          ctx: { user: mockUser },
        } as any);
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(error.message).toBe("Une erreur serveur s'est produite");
      }
    });

    test('should return empty list when no discussions exist', async () => {
      const input = {
        collectiviteId: 1,
        referentielId: 'cae' as const,
      };

      const expectedData: Discussion = {
        data: [],
        count: 0,
      };

      const expectedResponse: Result<Discussion, DiscussionError> = {
        success: true,
        data: expectedData,
      };

      vi.mocked(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).mockResolvedValue(expectedResponse);

      const listHandler = discussionRouter.router.list;

      const result = await listHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(result).toEqual(expectedData);
      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    test('should pass correct parameters with filters to application service', async () => {
      const input = {
        collectiviteId: 5,
        referentielId: 'eci' as const,
        filters: {
          status: 'ferme' as const,
          actionId: 'action.test.123',
        },
        options: {
          limit: 20,
          page: 2,
        },
      };

      const expectedResponse: Result<Discussion, DiscussionError> = {
        success: true,
        data: {
          data: [],
          count: 0,
        },
      };

      vi.mocked(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).mockResolvedValue(expectedResponse);

      const listHandler = discussionRouter.router.list;

      await listHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).toHaveBeenCalledTimes(1);
      expect(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).toHaveBeenCalledWith(
        {
          collectiviteId: input.collectiviteId,
          referentielId: input.referentielId,
          filters: input.filters,
          options: input.options,
        },
        mockUser
      );
    });

    test('should return data with correct structure on success', async () => {
      const input = {
        collectiviteId: 1,
        referentielId: 'cae' as const,
      };

      const expectedData: Discussion = {
        data: [
          {
            id: 1,
            collectiviteId: 1,
            actionId: 'test.action.1',
            status: 'ouvert',
            createdBy: mockUser.id,
            createdAt: '2025-10-17T10:00:00.000Z',
            messages: [],
          },
        ],
        count: 1,
      };

      const expectedResponse: Result<Discussion, DiscussionError> = {
        success: true,
        data: expectedData,
      };

      vi.mocked(
        mockDiscussionApplicationService.listDiscussionsWithMessages
      ).mockResolvedValue(expectedResponse);

      const listHandler = discussionRouter.router.list;

      const result = await listHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('count');
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.count).toBe('number');
    });
  });

  describe('delete', () => {
    test('should successfully delete a discussion message when service returns success', async () => {
      const input = {
        discussionMessageId: 100,
        collectiviteId: 1,
      };

      const expectedResponse: Result<void, DiscussionError> = {
        success: true,
        data: undefined,
      };

      vi.mocked(
        mockDiscussionApplicationService.deleteDiscussionMessage
      ).mockResolvedValue(expectedResponse);

      const deleteHandler = discussionRouter.router.delete;

      const result = await deleteHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(
        mockDiscussionApplicationService.deleteDiscussionMessage
      ).toHaveBeenCalledWith(
        input.discussionMessageId,
        input.collectiviteId,
        mockUser
      );
      expect(result).toEqual({ success: true });
    });

    test('should throw FORBIDDEN error when service returns UNAUTHORIZED error', async () => {
      const input = {
        discussionMessageId: 100,
        collectiviteId: 3,
      };

      const errorResponse: Result<void, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };

      vi.mocked(
        mockDiscussionApplicationService.deleteDiscussionMessage
      ).mockResolvedValue(errorResponse);

      const deleteHandler = discussionRouter.router.delete;

      await expect(
        deleteHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await deleteHandler({
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
        discussionMessageId: 100,
        collectiviteId: 1,
      };

      const errorResponse: Result<void, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };

      vi.mocked(
        mockDiscussionApplicationService.deleteDiscussionMessage
      ).mockResolvedValue(errorResponse);

      const deleteHandler = discussionRouter.router.delete;

      await expect(
        deleteHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await deleteHandler({
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
        discussionMessageId: 100,
        collectiviteId: 1,
      };

      const errorResponse: Result<void, DiscussionError> = {
        success: false,
        error: DiscussionErrorEnum.SERVER_ERROR,
      };

      vi.mocked(
        mockDiscussionApplicationService.deleteDiscussionMessage
      ).mockResolvedValue(errorResponse);

      const deleteHandler = discussionRouter.router.delete;

      await expect(
        deleteHandler({
          input,
          ctx: { user: mockUser },
        } as any)
      ).rejects.toThrow(TRPCError);

      try {
        await deleteHandler({
          input,
          ctx: { user: mockUser },
        } as any);
      } catch (error: any) {
        expect(error).toBeInstanceOf(TRPCError);
        expect(error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(error.message).toBe("Une erreur serveur s'est produite");
      }
    });

    test('should pass correct parameters to application service', async () => {
      const input = {
        discussionMessageId: 500,
        collectiviteId: 10,
      };

      const expectedResponse: Result<void, DiscussionError> = {
        success: true,
        data: undefined,
      };

      vi.mocked(
        mockDiscussionApplicationService.deleteDiscussionMessage
      ).mockResolvedValue(expectedResponse);

      const deleteHandler = discussionRouter.router.delete;

      await deleteHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(
        mockDiscussionApplicationService.deleteDiscussionMessage
      ).toHaveBeenCalledTimes(1);
      expect(
        mockDiscussionApplicationService.deleteDiscussionMessage
      ).toHaveBeenCalledWith(
        input.discussionMessageId,
        input.collectiviteId,
        mockUser
      );
    });

    test('should return success response with correct structure', async () => {
      const input = {
        discussionMessageId: 100,
        collectiviteId: 1,
      };

      const expectedResponse: Result<void, DiscussionError> = {
        success: true,
        data: undefined,
      };

      vi.mocked(
        mockDiscussionApplicationService.deleteDiscussionMessage
      ).mockResolvedValue(expectedResponse);

      const deleteHandler = discussionRouter.router.delete;

      const result = await deleteHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });
});
