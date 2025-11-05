import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DiscussionRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-repository.interface';
import { DiscussionType } from '../infrastructure/discussion.table';
import {
  CreateDiscussionData,
  CreateDiscussionMessageResponse,
  DiscussionMessage,
} from '../presentation/discussion.schemas';
import { DiscussionDomainService } from './discussion-domain-service';
import { DiscussionQueryService } from './discussion-query-service';
import { DiscussionErrorEnum } from './discussion.errors';
import { discussionStatus } from '@tet/domain/collectivites';

describe('DiscussionDomainService', () => {
  let service: DiscussionDomainService;
  let mockDiscussionRepository: Partial<DiscussionRepository>;
  let mockDiscussionQueryService: Partial<DiscussionQueryService>;
  let mockLogger: Partial<Logger>;

  const mockDiscussion: DiscussionType = {
    id: 1,
    collectiviteId: 123,
    actionId: 'action-1',
    status: discussionStatus.OUVERT,
    createdBy: 'user-id-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
  };

  const mockMessage: CreateDiscussionMessageResponse = {
    id: 1,
    discussionId: 1,
    message: 'Test message',
    createdBy: 'user-id-1',
    createdAt: '2025-01-01T00:00:00.000Z',
  };

  const mockUpdatedMessage: DiscussionMessage = {
    id: 1,
    discussionId: 1,
    message: 'Updated message',
    createdBy: 'user-id-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    createdByNom: null,
    createdByPrenom: null,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockDiscussionRepository = {
      create: vi.fn(),
      createDiscussionMessage: vi.fn(),
      findById: vi.fn(),
      findByCollectiviteIdAndReferentielId: vi.fn(),
      countMessagesDiscussionsByDiscussionId: vi.fn(),
      update: vi.fn(),
      deleteDiscussionAndDiscussionMessage: vi.fn(),
      deleteDiscussionMessage: vi.fn(),
      updateDiscussionMessage: vi.fn(),
    };

    mockDiscussionQueryService = {
      findByDiscussionIds: vi.fn(),
      listDiscussions: vi.fn(),
    };

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionDomainService,
        {
          provide: 'DiscussionRepository',
          useValue: mockDiscussionRepository as DiscussionRepository,
        },
        {
          provide: DiscussionQueryService,
          useValue: mockDiscussionQueryService as DiscussionQueryService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<DiscussionDomainService>(DiscussionDomainService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdateDiscussion', () => {
    const createDiscussionData: CreateDiscussionData = {
      collectiviteId: 123,
      actionId: 'action-1',
      message: 'Test message',
      createdBy: 'user-id-1',
    };

    test('should create a new discussion and message when discussionId is not provided', async () => {
      vi.mocked(mockDiscussionRepository.create)?.mockResolvedValue({
        success: true,
        data: mockDiscussion,
      });

      vi.mocked(
        mockDiscussionRepository.createDiscussionMessage
      )?.mockResolvedValue({
        success: true,
        data: mockMessage,
      });

      const result = await service.createOrUpdateDiscussion(
        createDiscussionData
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.messageId).toBe(1);
        expect(result.data.message).toBe('Test message');
        expect(result.data.collectiviteId).toBe(123);
        expect(result.data.actionId).toBe('action-1');
        expect(result.data.status).toBe(discussionStatus.OUVERT);
        expect(result.data.createdBy).toBe('user-id-1');
      }

      expect(mockDiscussionRepository.create).toHaveBeenCalledWith(
        createDiscussionData
      );

      expect(
        mockDiscussionRepository.createDiscussionMessage
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          discussionId: 1,
          message: 'Test message',
          createdBy: 'user-id-1',
        }),
        undefined
      );
    });

    test('should add a message to an existing discussion when discussionId is provided', async () => {
      const dataWithDiscussionId: CreateDiscussionData = {
        ...createDiscussionData,
        discussionId: 1,
      };

      vi.mocked(mockDiscussionRepository.findById)?.mockResolvedValue({
        success: true,
        data: mockDiscussion,
      });

      vi.mocked(
        mockDiscussionRepository.createDiscussionMessage
      )?.mockResolvedValue({
        success: true,
        data: mockMessage,
      });

      const result = await service.createOrUpdateDiscussion(
        dataWithDiscussionId
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.messageId).toBe(1);
      }
      expect(mockDiscussionRepository.findById).toHaveBeenCalledWith(1);
      expect(
        mockDiscussionRepository.createDiscussionMessage
      ).toHaveBeenCalled();
    });

    test('should return error when discussion is not found', async () => {
      const dataWithDiscussionId: CreateDiscussionData = {
        ...createDiscussionData,
        discussionId: 999,
      };

      vi.mocked(mockDiscussionRepository.findById)?.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.NOT_FOUND,
      });

      const result = await service.createOrUpdateDiscussion(
        dataWithDiscussionId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.NOT_FOUND);
      }
    });

    test('should return error when discussion creation fails', async () => {
      vi.mocked(mockDiscussionRepository.create)?.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.createOrUpdateDiscussion(
        createDiscussionData
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });

    test('should return error when message creation fails', async () => {
      vi.mocked(mockDiscussionRepository.create)?.mockResolvedValue({
        success: true,
        data: mockDiscussion,
      });

      vi.mocked(
        mockDiscussionRepository.createDiscussionMessage
      )?.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.createOrUpdateDiscussion(
        createDiscussionData
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });
  });

  describe('deleteDiscussionAndDiscussionMessage', () => {
    test('should delete a discussion message', async () => {
      vi.mocked(
        mockDiscussionRepository.deleteDiscussionAndDiscussionMessage
      )?.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await service.deleteDiscussionAndDiscussionMessage(1);

      expect(result.success).toBe(true);
      expect(
        mockDiscussionRepository.deleteDiscussionAndDiscussionMessage
      ).toHaveBeenCalledWith(1);
    });

    test('should return error when deletion fails', async () => {
      vi.mocked(
        mockDiscussionRepository.deleteDiscussionAndDiscussionMessage
      )?.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.deleteDiscussionAndDiscussionMessage(1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });
  });

  describe('deleteDiscussionMessage', () => {
    test('should delete a message when there are multiple messages', async () => {
      vi.mocked(
        mockDiscussionRepository.countMessagesDiscussionsByDiscussionId
      )?.mockResolvedValue({
        success: true,
        data: 2,
      });

      vi.mocked(
        mockDiscussionRepository.deleteDiscussionMessage
      )?.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await service.deleteDiscussionMessage(1, 1);

      expect(result.success).toBe(true);
      expect(
        mockDiscussionRepository.countMessagesDiscussionsByDiscussionId
      ).toHaveBeenCalledWith(1);
      expect(
        mockDiscussionRepository.deleteDiscussionMessage
      ).toHaveBeenCalledWith(1);
      expect(
        mockDiscussionRepository.deleteDiscussionAndDiscussionMessage
      ).not.toHaveBeenCalled();
    });

    test('should delete discussion and message when it is the last message', async () => {
      vi.mocked(
        mockDiscussionRepository.countMessagesDiscussionsByDiscussionId
      )?.mockResolvedValue({
        success: true,
        data: 1,
      });

      vi.mocked(
        mockDiscussionRepository.deleteDiscussionAndDiscussionMessage
      )?.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await service.deleteDiscussionMessage(1, 1);

      expect(result.success).toBe(true);
      expect(
        mockDiscussionRepository.countMessagesDiscussionsByDiscussionId
      ).toHaveBeenCalledWith(1);
      expect(
        mockDiscussionRepository.deleteDiscussionAndDiscussionMessage
      ).toHaveBeenCalledWith(1);
      expect(
        mockDiscussionRepository.deleteDiscussionMessage
      ).not.toHaveBeenCalled();
    });

    test('should return error when counting messages fails', async () => {
      vi.mocked(
        mockDiscussionRepository.countMessagesDiscussionsByDiscussionId
      )?.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.deleteDiscussionMessage(1, 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
      expect(
        mockDiscussionRepository.deleteDiscussionMessage
      ).not.toHaveBeenCalled();
      expect(
        mockDiscussionRepository.deleteDiscussionAndDiscussionMessage
      ).not.toHaveBeenCalled();
    });

    test('should return error when deleting discussion fails (last message)', async () => {
      vi.mocked(
        mockDiscussionRepository.countMessagesDiscussionsByDiscussionId
      )?.mockResolvedValue({
        success: true,
        data: 1,
      });

      vi.mocked(
        mockDiscussionRepository.deleteDiscussionAndDiscussionMessage
      )?.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.deleteDiscussionMessage(1, 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
      expect(
        mockDiscussionRepository.deleteDiscussionMessage
      ).not.toHaveBeenCalled();
    });

    test('should return error when deleting message fails', async () => {
      vi.mocked(
        mockDiscussionRepository.countMessagesDiscussionsByDiscussionId
      )?.mockResolvedValue({
        success: true,
        data: 2,
      });

      vi.mocked(
        mockDiscussionRepository.deleteDiscussionMessage
      )?.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.deleteDiscussionMessage(1, 1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
      expect(
        mockDiscussionRepository.deleteDiscussionAndDiscussionMessage
      ).not.toHaveBeenCalled();
    });
  });

  describe('updateDiscussion', () => {
    test('should update discussion status', async () => {
      const updatedDiscussion = {
        ...mockDiscussion,
        status: discussionStatus.FERME,
      };

      vi.mocked(mockDiscussionRepository.update)?.mockResolvedValue({
        success: true,
        data: updatedDiscussion,
      });

      const result = await service.updateDiscussion(1, discussionStatus.FERME);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(discussionStatus.FERME);
      }
      expect(mockDiscussionRepository.update).toHaveBeenCalledWith(
        1,
        discussionStatus.FERME
      );
    });

    test('should return error when update fails', async () => {
      vi.mocked(mockDiscussionRepository.update)?.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.updateDiscussion(1, discussionStatus.FERME);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });
  });

  describe('updateDiscussionMessage', () => {
    test('should update discussion message', async () => {
      vi.mocked(
        mockDiscussionRepository.updateDiscussionMessage
      )?.mockResolvedValue({
        success: true,
        data: mockUpdatedMessage,
      });

      const result = await service.updateDiscussionMessage(
        1,
        'Updated message'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Updated message');
      }
      expect(
        mockDiscussionRepository.updateDiscussionMessage
      ).toHaveBeenCalledWith(1, 'Updated message');
    });

    test('should return error when update fails', async () => {
      vi.mocked(
        mockDiscussionRepository.updateDiscussionMessage
      )?.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.updateDiscussionMessage(
        1,
        'Updated message'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
      expect(
        mockDiscussionRepository.updateDiscussionMessage
      ).toHaveBeenCalledWith(1, 'Updated message');
    });
  });

  // Note: list method is currently commented out in the implementation
  // Uncomment these tests when the list method is re-implemented
  // describe('list', () => {
  //   const mockDiscussionWithActionName = {
  //     ...mockDiscussion,
  //     actionNom: 'Action name',
  //     actionIdentifiant: 'action-1',
  //   };

  //   test('should list discussions with their messages', async () => {
  //     vi.mocked(mockDiscussionQueryService.listDiscussions)?.mockResolvedValue({
  //       success: true,
  //       data: [mockDiscussionWithActionName],
  //     });

  //     vi.mocked(
  //       mockDiscussionQueryService.findByDiscussionIds
  //     )?.mockResolvedValue({
  //       success: true,
  //       data: [mockMessage],
  //     });

  //     const result = await service.list(123, 'cae' as ReferentielEnum);

  //     expect(result.success).toBe(true);
  //     if (result.success) {
  //       expect(result.data.data[0].actionNom).toBe('Action name');
  //       expect(result.data.data[0].actionIdentifiant).toBe('action-1');
  //       expect(result.data.data[0].messages).toHaveLength(1);
  //       expect(result.data.count).toBe(1);
  //     }

  //     expect(mockDiscussionQueryService.listDiscussions).toHaveBeenCalledWith(
  //       123,
  //       'cae',
  //       undefined,
  //       undefined
  //     );
  //   });

  //   test('should return empty list when no discussions found', async () => {
  //     vi.mocked(mockDiscussionQueryService.listDiscussions)?.mockResolvedValue({
  //       success: true,
  //       data: [],
  //     });

  //     vi.mocked(
  //       mockDiscussionQueryService.findByDiscussionIds
  //     )?.mockResolvedValue({
  //       success: true,
  //       data: [],
  //     });

  //     const result = await service.list(123, 'cae' as ReferentielEnum);

  //     expect(result.success).toBe(true);
  //     if (result.success) {
  //       expect(result.data.data).toHaveLength(0);
  //       expect(result.data.count).toBe(0);
  //     }
  //   });

  //   test('should return error when discussion list fails', async () => {
  //     vi.mocked(mockDiscussionQueryService.listDiscussions)?.mockResolvedValue({
  //       success: false,
  //       error: DiscussionErrorEnum.DATABASE_ERROR,
  //     });

  //     const result = await service.list(123, 'cae' as ReferentielEnum);

  //     expect(result.success).toBe(false);
  //     if (!result.success) {
  //       expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
  //     }
  //   });

  //   test('should return error when message fetching fails', async () => {
  //     vi.mocked(mockDiscussionQueryService.listDiscussions)?.mockResolvedValue({
  //       success: true,
  //       data: [mockDiscussionWithActionName],
  //     });

  //     vi.mocked(
  //       mockDiscussionQueryService.findByDiscussionIds
  //     )?.mockResolvedValue({
  //       success: false,
  //       error: DiscussionErrorEnum.DATABASE_ERROR,
  //     });

  //     const result = await service.list(123, 'cae' as ReferentielEnum);

  //     expect(result.success).toBe(false);
  //     if (!result.success) {
  //       expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
  //     }
  //   });
  // });
});
