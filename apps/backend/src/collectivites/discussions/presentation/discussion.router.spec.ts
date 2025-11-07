import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DiscussionApplicationService } from '../application/discussion-application.service';
import { DiscussionErrorEnum } from '../domain/discussion.errors';
import { DiscussionRouter } from './discussion.router';

describe('DiscussionRouter', () => {
  let router: DiscussionRouter;
  let discussionApplicationService: Partial<DiscussionApplicationService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockDiscussion = {
    id: 1,
    collectiviteId: 1,
    actionId: 'action-1',
    status: 'en_cours',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTrpcProcedure = {
      input: vi.fn().mockReturnThis(),
      mutation: vi.fn((handler) => handler),
      query: vi.fn((handler) => handler),
    };

    const mockTrpcRouter = vi.fn((routes) => routes);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionRouter,
        {
          provide: TrpcService,
          useValue: {
            router: mockTrpcRouter,
            authedProcedure: mockTrpcProcedure,
          },
        },
        {
          provide: DiscussionApplicationService,
          useValue: {
            createDiscussion: vi.fn(),
            listDiscussionsWithMessages: vi.fn(),
            updateDiscussion: vi.fn(),
            deleteDiscussionAndDiscussionMessage: vi.fn(),
          },
        },
      ],
    }).compile();

    router = module.get<DiscussionRouter>(DiscussionRouter);
    discussionApplicationService = module.get(
      DiscussionApplicationService
    ) as Partial<DiscussionApplicationService>;
    trpcService = module.get<TrpcService>(TrpcService);
  });

  describe('create', () => {
    test('should create a discussion successfully', async () => {
      const input = {
        collectiviteId: 1,
        actionId: 'action-1',
        message: 'Test message',
      };

      const successResult = {
        success: true as const,
        data: mockDiscussion,
      };

      (discussionApplicationService.createDiscussion as any).mockResolvedValue(
        successResult
      );

      const createHandler = router.router.create;
      const result = await createHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(result).toEqual(mockDiscussion);
      expect(
        discussionApplicationService.createDiscussion
      ).toHaveBeenCalledWith(input, mockUser);
    });

    test('should throw TRPC error on unauthorized', async () => {
      const input = {
        collectiviteId: 1,
        actionId: 'action-1',
        message: 'Test message',
      };

      const errorResult = {
        success: false as const,
        error: DiscussionErrorEnum.UNAUTHORIZED,
      };

      (discussionApplicationService.createDiscussion as any).mockResolvedValue(
        errorResult
      );

      const createHandler = router.router.create;

      await expect(
        createHandler({ input, ctx: { user: mockUser } } as any)
      ).rejects.toThrow(TRPCError);

      await expect(
        createHandler({ input, ctx: { user: mockUser } } as any)
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: "Vous n'avez pas les permissions nécessaires",
      });
    });

    test('should throw TRPC error on database error', async () => {
      const input = {
        collectiviteId: 1,
        actionId: 'action-1',
        message: 'Test message',
      };

      const errorResult = {
        success: false as const,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };

      (discussionApplicationService.createDiscussion as any).mockResolvedValue(
        errorResult
      );

      const createHandler = router.router.create;

      await expect(
        createHandler({ input, ctx: { user: mockUser } } as any)
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: "Une erreur de base de données s'est produite",
      });
    });
  });

  describe('list', () => {
    test('should list discussions successfully', async () => {
      const input = {
        collectiviteId: 1,
        referentielId: 'cae' as const,
      };

      const discussions = [mockDiscussion];
      const successResult = {
        success: true as const,
        data: discussions,
      };

      (
        discussionApplicationService.listDiscussionsWithMessages as any
      ).mockResolvedValue(successResult);

      const listHandler = router.router.list;
      const result = await listHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(result).toEqual(discussions);
      expect(
        discussionApplicationService.listDiscussionsWithMessages
      ).toHaveBeenCalledWith(input, mockUser);
    });

    test('should throw TRPC error when filters are not valid', async () => {
      const input = {
        collectiviteId: 1,
        referentielId: 'cae' as const,
      };

      const errorResult = {
        success: false as const,
        error: DiscussionErrorEnum.FILTERS_NOT_VALID,
      };

      (
        discussionApplicationService.listDiscussionsWithMessages as any
      ).mockResolvedValue(errorResult);

      const listHandler = router.router.list;

      await expect(
        listHandler({ input, ctx: { user: mockUser } } as any)
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Les filtres fournis ne sont pas valides',
      });
    });
  });

  describe('update', () => {
    test('should update a discussion successfully', async () => {
      const input = {
        discussionId: 1,
        collectiviteId: 1,
        status: 'clos' as const,
      };

      const updatedDiscussion = { ...mockDiscussion, status: 'clos' };
      const successResult = {
        success: true as const,
        data: updatedDiscussion,
      };

      (discussionApplicationService.updateDiscussion as any).mockResolvedValue(
        successResult
      );

      const updateHandler = router.router.update;
      const result = await updateHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(result).toEqual(updatedDiscussion);
      expect(
        discussionApplicationService.updateDiscussion
      ).toHaveBeenCalledWith(input, mockUser);
    });

    test('should throw TRPC error when discussion is not found', async () => {
      const input = {
        discussionId: 999,
        collectiviteId: 1,
        status: 'clos' as const,
      };

      const errorResult = {
        success: false as const,
        error: DiscussionErrorEnum.NOT_FOUND,
      };

      (discussionApplicationService.updateDiscussion as any).mockResolvedValue(
        errorResult
      );

      const updateHandler = router.router.update;

      await expect(
        updateHandler({ input, ctx: { user: mockUser } } as any)
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: "La discussion demandée n'existe pas",
      });
    });
  });

  describe('delete', () => {
    test('should delete a discussion successfully', async () => {
      const input = {
        discussionId: 1,
        collectiviteId: 1,
      };

      const successResult = {
        success: true as const,
        data: undefined,
      };

      (
        discussionApplicationService.deleteDiscussionAndDiscussionMessage as any
      ).mockResolvedValue(successResult);

      const deleteHandler = router.router.delete;
      const result = await deleteHandler({
        input,
        ctx: { user: mockUser },
      } as any);

      expect(result).toEqual({ success: true });
      expect(
        discussionApplicationService.deleteDiscussionAndDiscussionMessage
      ).toHaveBeenCalledWith(input, mockUser);
    });

    test('should throw TRPC error on forbidden', async () => {
      const input = {
        discussionId: 1,
        collectiviteId: 1,
      };

      const errorResult = {
        success: false as const,
        error: DiscussionErrorEnum.FORBIDDEN,
      };

      (
        discussionApplicationService.deleteDiscussionAndDiscussionMessage as any
      ).mockResolvedValue(errorResult);

      const deleteHandler = router.router.delete;

      await expect(
        deleteHandler({ input, ctx: { user: mockUser } } as any)
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: "Vous n'avez pas les permissions nécessaires",
      });
    });
  });

  describe('error handling', () => {
    test('should map all error types correctly', async () => {
      const errorMappings = [
        {
          error: DiscussionErrorEnum.UNAUTHORIZED,
          expectedCode: 'FORBIDDEN',
          expectedMessage: "Vous n'avez pas les permissions nécessaires",
        },
        {
          error: DiscussionErrorEnum.FORBIDDEN,
          expectedCode: 'FORBIDDEN',
          expectedMessage: "Vous n'avez pas les permissions nécessaires",
        },
        {
          error: DiscussionErrorEnum.INTERNAL_SERVER_ERROR,
          expectedCode: 'INTERNAL_SERVER_ERROR',
          expectedMessage: "Une erreur serveur s'est produite",
        },
        {
          error: DiscussionErrorEnum.SERVER_ERROR,
          expectedCode: 'INTERNAL_SERVER_ERROR',
          expectedMessage: "Une erreur serveur s'est produite",
        },
        {
          error: DiscussionErrorEnum.FILTERS_NOT_VALID,
          expectedCode: 'BAD_REQUEST',
          expectedMessage: 'Les filtres fournis ne sont pas valides',
        },
        {
          error: DiscussionErrorEnum.OPTIONS_NOT_VALID,
          expectedCode: 'BAD_REQUEST',
          expectedMessage: 'Les options fournies ne sont pas valides',
        },
        {
          error: DiscussionErrorEnum.BAD_REQUEST,
          expectedCode: 'BAD_REQUEST',
          expectedMessage: 'Les paramètres fournis ne sont pas valides',
        },
        {
          error: DiscussionErrorEnum.NOT_FOUND,
          expectedCode: 'NOT_FOUND',
          expectedMessage: "La discussion demandée n'existe pas",
        },
        {
          error: DiscussionErrorEnum.DATABASE_ERROR,
          expectedCode: 'INTERNAL_SERVER_ERROR',
          expectedMessage: "Une erreur de base de données s'est produite",
        },
      ];

      for (const mapping of errorMappings) {
        const input = {
          collectiviteId: 1,
          actionId: 'action-1',
          message: 'Test',
        };

        (
          discussionApplicationService.createDiscussion as any
        ).mockResolvedValue({
          success: false,
          error: mapping.error,
        });

        const createHandler = router.router.create;

        await expect(
          createHandler({ input, ctx: { user: mockUser } } as any)
        ).rejects.toMatchObject({
          code: mapping.expectedCode,
          message: mapping.expectedMessage,
        });
      }
    });
  });
});
