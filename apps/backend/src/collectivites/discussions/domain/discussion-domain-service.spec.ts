import { DatabaseService } from '@/backend/utils/database/database.service';
import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscussionDomainService } from './discussion-domain-service';
import {
  CreateDiscussionData,
  DiscussionErrorEnum,
  DiscussionMessageType,
  DiscussionStatutEnum,
  DiscussionType,
  ListDiscussionsRequestFilters,
  QueryOptionsType,
  ReferentielEnum,
} from './discussion.type';

describe('DiscussionDomainService', () => {
  let service: DiscussionDomainService;
  let mockDiscussionRepository: any;
  let mockDiscussionMessageRepository: any;
  let mockDatabaseService: any;
  let mockLogger: any;

  beforeEach(() => {
    // Mock repositories and logger
    mockDiscussionRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findOrCreate: vi.fn(),
    };

    mockDiscussionMessageRepository = {
      create: vi.fn(),
      delete: vi.fn(),
    };

    mockDatabaseService = {
      db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
      },
    };

    mockLogger = {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    // Create service with mocks
    service = new DiscussionDomainService(
      mockDiscussionRepository,
      mockDiscussionMessageRepository,
      mockDatabaseService as DatabaseService,
      mockLogger as Logger
    );
  });

  describe('insert', () => {
    describe('when discussion does not exist', () => {
      it('should create a new discussion and message successfully', async () => {
        const discussionData: CreateDiscussionData = {
          collectiviteId: 123,
          actionId: 'action-1',
          createdBy: 'user-id-1',
          message: 'Test message',
        }),
        undefined
      );

        const createdDiscussion: DiscussionType = {
          id: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'user-id-123',
          createdAt: '2025-10-17T10:00:00.000Z',
          modifiedAt: '2025-10-17T10:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 100,
          discussionId: 1,
          message: 'Test message',
          createdBy: 'user-id-123',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findOrCreate.mockResolvedValue({
          success: true,
          data: createdDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            id: 1,
            messageId: 100,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            createdBy: 'user-id-123',
            createdAt: expect.any(String),
            message: 'Test message',
          });
          expect(result.data.createdAt).toBeDefined();
        }

        expect(mockDiscussionRepository.findOrCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            createdBy: 'user-id-123',
          }),
          undefined
        );
        expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            discussionId: 1,
            message: 'Test message',
            createdBy: 'user-id-123',
          }),
          undefined
        );
      });

      it('should set status to OUVERT when creating new discussion', async () => {
        const discussionData: CreateDiscussionData = {
          collectiviteId: 456,
          actionId: 'eci.2.1.1',
          message: 'New discussion message',
          createdBy: 'user-id-456',
        };

        const createdDiscussion: DiscussionType = {
          id: 2,
          collectiviteId: 456,
          actionId: 'eci.2.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'user-id-456',
          createdAt: '2025-10-17T11:00:00.000Z',
          modifiedAt: '2025-10-17T11:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 200,
          discussionId: 2,
          message: 'New discussion message',
          createdBy: 'user-id-456',
          createdAt: '2025-10-17T11:00:00.000Z',
        };

        mockDiscussionRepository.findOrCreate.mockResolvedValue({
          success: true,
          data: createdDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        await service.insert(discussionData);

        expect(mockDiscussionRepository.findOrCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            status: DiscussionStatutEnum.OUVERT,
          }),
          undefined
        );
      });

      it('should set timestamps when creating new discussion', async () => {
        const discussionData: CreateDiscussionData = {
          collectiviteId: 789,
          actionId: 'cae.3.1.1',
          message: 'Timestamp test',
          createdBy: 'user-id-789',
        };

        const createdDiscussion: DiscussionType = {
          id: 3,
          collectiviteId: 789,
          actionId: 'cae.3.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'user-id-789',
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
        };

        const createdMessage: DiscussionMessageType = {
          id: 300,
          discussionId: 3,
          message: 'Timestamp test',
          createdBy: 'user-id-789',
          createdAt: new Date().toISOString(),
        };

        mockDiscussionRepository.findOrCreate.mockResolvedValue({
          success: true,
          data: createdDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        await service.insert(discussionData);

        const createCall =
          mockDiscussionRepository.findOrCreate.mock.calls[0][0];
        expect(createCall.createdAt).toBeDefined();
        expect(createCall.modifiedAt).toBeDefined();
        expect(typeof createCall.createdAt).toBe('string');
        expect(typeof createCall.modifiedAt).toBe('string');
      });
    });

    describe('when discussion already exists', () => {
      it('should reuse existing discussion and create new message', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: 'Reply to existing discussion',
          createdBy: 'user-id-123',
        };

        const existingDiscussion: DiscussionType = {
          id: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'original-user-id',
          createdAt: '2025-10-17T09:00:00.000Z',
          modifiedAt: '2025-10-17T09:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 150,
          discussionId: 1,
          message: 'Reply to existing discussion',
          createdBy: 'user-id-123',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findById.mockResolvedValue({
          success: true,
          data: existingDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            id: 1,
            messageId: 150,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            createdBy: 'user-id-123',
            createdAt: expect.any(String),
            message: 'Reply to existing discussion',
          });
          expect(result.data.createdAt).toBeDefined();
        }

        expect(mockDiscussionRepository.findById).toHaveBeenCalledWith(1);
        expect(mockDiscussionRepository.create).not.toHaveBeenCalled();
        expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            discussionId: 1,
            message: 'Reply to existing discussion',
            createdBy: 'user-id-123',
          }),
          undefined
        );
      });

      it('should preserve existing discussion status and metadata', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 5,
          collectiviteId: 789,
          actionId: 'cae.5.1.1',
          message: 'Another reply',
          createdBy: 'user-id-new',
        };

        const existingDiscussion: DiscussionType = {
          id: 5,
          collectiviteId: 789,
          actionId: 'cae.5.1.1',
          status: DiscussionStatutEnum.FERME,
          createdBy: 'original-user-id',
          createdAt: '2025-10-15T09:00:00.000Z',
          modifiedAt: '2025-10-16T09:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 500,
          discussionId: 5,
          message: 'Another reply',
          createdBy: 'user-id-new',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findById.mockResolvedValue({
          success: true,
          data: existingDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(DiscussionStatutEnum.FERME);
          expect(result.data.id).toBe(5);
        }
      });
    });

    describe('error handling', () => {
      it('should return DATABASE_ERROR when discussion creation fails', async () => {
        const discussionData: CreateDiscussionData = {
          collectiviteId: 999,
          actionId: 'cae.10.1.1',
          message: 'Test message',
          createdBy: 'user-id-999',
        };

        mockDiscussionRepository.findOrCreate.mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error finding or creating discussion')
        );
        expect(mockDiscussionMessageRepository.create).not.toHaveBeenCalled();
      });

      it('should return DATABASE_ERROR when message creation fails', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 11,
          collectiviteId: 888,
          actionId: 'cae.11.1.1',
          message: 'Test message',
          createdBy: 'user-id-888',
        };

        const existingDiscussion: DiscussionType = {
          id: 11,
          collectiviteId: 888,
          actionId: 'cae.11.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'user-id-888',
          createdAt: '2025-10-17T10:00:00.000Z',
          modifiedAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findById.mockResolvedValue({
          success: true,
          data: existingDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
        }

        expect(mockDiscussionMessageRepository.create).toHaveBeenCalled();
      });

      it('should log error with correct details when discussion creation fails', async () => {
        const discussionData: CreateDiscussionData = {
          collectiviteId: 777,
          actionId: 'cae.12.1.1',
          message: 'Test message',
          createdBy: 'user-id-777',
        };

        mockDiscussionRepository.findOrCreate.mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.SERVER_ERROR,
        });

        await service.insert(discussionData);

        expect(mockLogger.error).toHaveBeenCalledWith(
          `Error finding or creating discussion: ${DiscussionErrorEnum.SERVER_ERROR}`
        );
      });

      it('should return NOT_FOUND error when discussionId is provided but discussion not found', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 999,
          collectiviteId: 888,
          actionId: 'cae.13.1.1',
          message: 'Test message',
          createdBy: 'user-id-888',
        };

        mockDiscussionRepository.findById.mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.NOT_FOUND,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(DiscussionErrorEnum.NOT_FOUND);
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Discussion with id 999 not found'
        );
        expect(mockDiscussionMessageRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('data transformation', () => {
      it('should correctly map discussion data to message data', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 20,
          collectiviteId: 100,
          actionId: 'eci.1.1.1',
          message: 'Mapping test message',
          createdBy: 'test-user',
        };

        const existingDiscussion: DiscussionType = {
          id: 20,
          collectiviteId: 100,
          actionId: 'eci.1.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
          modifiedAt: '2025-10-17T10:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 2000,
          discussionId: 20,
          message: 'Mapping test message',
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findById.mockResolvedValue({
          success: true,
          data: existingDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        await service.insert(discussionData);

        expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith(
          {
            discussionId: 20,
            message: 'Mapping test message',
            createdBy: 'test-user',
            createdAt: expect.any(String),
          },
          undefined
        );
      });

      it('should set message timestamp when creating message', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 21,
          collectiviteId: 200,
          actionId: 'cae.2.1.1',
          message: 'Timestamp test',
          createdBy: 'test-user',
        };

        const existingDiscussion: DiscussionType = {
          id: 21,
          collectiviteId: 200,
          actionId: 'cae.2.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'test-user',
          createdAt: '2025-10-17T09:00:00.000Z',
          modifiedAt: '2025-10-17T09:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 2100,
          discussionId: 21,
          message: 'Timestamp test',
          createdBy: 'test-user',
          createdAt: new Date().toISOString(),
        };

        mockDiscussionRepository.findById.mockResolvedValue({
          success: true,
          data: existingDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        await service.insert(discussionData);

        const createCall =
          mockDiscussionMessageRepository.create.mock.calls[0][0];
        expect(createCall.createdAt).toBeDefined();
        expect(typeof createCall.createdAt).toBe('string');
      });
    });

    describe('transaction support', () => {
      it('should accept and pass transaction parameter when using findById', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 30,
          collectiviteId: 300,
          actionId: 'cae.3.1.1',
          message: 'Transaction test',
          createdBy: 'test-user',
        };

        const mockTransaction = {} as any;

        const existingDiscussion: DiscussionType = {
          id: 30,
          collectiviteId: 300,
          actionId: 'cae.3.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
          modifiedAt: '2025-10-17T10:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 3000,
          discussionId: 30,
          message: 'Transaction test',
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findById.mockResolvedValue({
          success: true,
          data: existingDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        const result = await service.insert(discussionData, mockTransaction);

        expect(result.success).toBe(true);
        expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith(
          expect.any(Object),
          mockTransaction
        );
      });

      it('should accept and pass transaction parameter when using findOrCreate', async () => {
        const discussionData: CreateDiscussionData = {
          collectiviteId: 300,
          actionId: 'cae.3.1.1',
          message: 'Transaction test',
          createdBy: 'test-user',
        };

        const mockTransaction = {} as any;

        const createdDiscussion: DiscussionType = {
          id: 30,
          collectiviteId: 300,
          actionId: 'cae.3.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
          modifiedAt: '2025-10-17T10:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 3000,
          discussionId: 30,
          message: 'Transaction test',
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findOrCreate.mockResolvedValue({
          success: true,
          data: createdDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        const result = await service.insert(discussionData, mockTransaction);

        expect(result.success).toBe(true);
        expect(mockDiscussionRepository.findOrCreate).toHaveBeenCalledWith(
          expect.any(Object),
          mockTransaction
        );
        expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith(
          expect.any(Object),
          mockTransaction
        );
      });
    });

    describe('edge cases', () => {
      it('should handle empty message string', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 40,
          collectiviteId: 400,
          actionId: 'cae.4.1.1',
          message: '',
          createdBy: 'test-user',
        };

        const existingDiscussion: DiscussionType = {
          id: 40,
          collectiviteId: 400,
          actionId: 'cae.4.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
          modifiedAt: '2025-10-17T10:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 4000,
          discussionId: 40,
          message: '',
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findById.mockResolvedValue({
          success: true,
          data: existingDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.message).toBe('');
        }
      });

      it('should handle very long messages', async () => {
        const longMessage = 'a'.repeat(10000);
        const discussionData: CreateDiscussionData = {
          discussionId: 50,
          collectiviteId: 500,
          actionId: 'cae.5.1.1',
          message: longMessage,
          createdBy: 'test-user',
        };

        const existingDiscussion: DiscussionType = {
          id: 50,
          collectiviteId: 500,
          actionId: 'cae.5.1.1',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
          modifiedAt: '2025-10-17T10:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 5000,
          discussionId: 50,
          message: longMessage,
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findById.mockResolvedValue({
          success: true,
          data: existingDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.message).toBe(longMessage);
          expect(result.data.message.length).toBe(10000);
        }
      });

      it('should handle special characters in actionId', async () => {
        const discussionData: CreateDiscussionData = {
          collectiviteId: 600,
          actionId: 'cae.1.2.3_special-chars',
          message: 'Special chars test',
          createdBy: 'test-user',
        };

        const createdDiscussion: DiscussionType = {
          id: 60,
          collectiviteId: 600,
          actionId: 'cae.1.2.3_special-chars',
          status: DiscussionStatutEnum.OUVERT,
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
          modifiedAt: '2025-10-17T10:00:00.000Z',
        };

        const createdMessage: DiscussionMessageType = {
          id: 6000,
          discussionId: 60,
          message: 'Special chars test',
          createdBy: 'test-user',
          createdAt: '2025-10-17T10:00:00.000Z',
        };

        mockDiscussionRepository.findOrCreate.mockResolvedValue({
          success: true,
          data: createdDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.actionId).toBe('cae.1.2.3_special-chars');
        }
      });
    });
  });

  describe('deleteDiscussionMessage', () => {
    it('should successfully delete a discussion message', async () => {
      const messageId = 123;

      mockDiscussionMessageRepository.delete.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await service.deleteDiscussionMessage(messageId);

      expect(result.success).toBe(true);
      expect(mockDiscussionMessageRepository.delete).toHaveBeenCalledWith(
        messageId
      );
    });

    it('should return error when deletion fails', async () => {
      const messageId = 456;

      mockDiscussionMessageRepository.delete.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.deleteDiscussionMessage(messageId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
      expect(mockDiscussionMessageRepository.delete).toHaveBeenCalledWith(
        messageId
      );
    });

    it('should handle deletion of non-existent message', async () => {
      const nonExistentMessageId = 999;

      mockDiscussionMessageRepository.delete.mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.deleteDiscussionMessage(
        nonExistentMessageId
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });
  });

  describe('list', () => {
    describe('successful listing', () => {
      it('should list discussions for a collectivite and referentiel', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'First message',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ];

        // Mock the query chain
        const mockQuery = vi.fn().mockResolvedValue(mockQueryResult);
        mockDatabaseService.db.select.mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockReturnValue(mockQuery()),
                }),
              }),
            }),
          }),
        });

        // Manually mock the getDiscussionsQuery call
        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(1);
          expect(result.data.data[0]).toEqual({
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            createdBy: 'user-1',
            createdAt: '2025-10-17T10:00:00.000Z',
            messages: mockQueryResult[0].messages,
          });
          expect(result.data.count).toBe(1);
        }
      });

      it('should list multiple discussions with multiple messages', async () => {
        const collectiviteId = 456;
        const referentielId: ReferentielEnum = 'eci';

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 456,
            actionId: 'eci.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 2,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'First message',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
              {
                id: 101,
                discussionId: 1,
                message: 'Second message',
                createdBy: 'user-2',
                createdAt: '2025-10-17T11:00:00.000Z',
              },
            ],
          },
          {
            id: 2,
            collectiviteId: 456,
            actionId: 'eci.2.1.1',
            status: DiscussionStatutEnum.FERME,
            count: 2,
            messages: [
              {
                id: 200,
                discussionId: 2,
                message: 'Another message',
                createdBy: 'user-3',
                createdAt: '2025-10-17T12:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(2);
          expect(result.data.count).toBe(3); // Total messages: 2 + 1
          expect(result.data.data[0].messages).toHaveLength(2);
          expect(result.data.data[1].messages).toHaveLength(1);
        }
      });

      it('should return empty array when no discussions found', async () => {
        const collectiviteId = 789;
        const referentielId: ReferentielEnum = 'te';

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue([]);

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(0);
          expect(result.data.count).toBe(0);
        }
      });
    });

    describe('filtering', () => {
      it('should filter discussions by status', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';
        const filters: ListDiscussionsRequestFilters = {
          status: DiscussionStatutEnum.OUVERT,
        };

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'Open discussion',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(
          collectiviteId,
          referentielId,
          filters
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(1);
          expect(result.data.data[0].status).toBe(DiscussionStatutEnum.OUVERT);
        }
      });

      it('should filter discussions by actionId', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';
        const filters: ListDiscussionsRequestFilters = {
          actionId: 'cae.1.1.1',
        };

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'Specific action discussion',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(
          collectiviteId,
          referentielId,
          filters
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(1);
          expect(result.data.data[0].actionId).toBe('cae.1.1.1');
        }
      });

      it('should apply multiple filters simultaneously', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';
        const filters: ListDiscussionsRequestFilters = {
          status: DiscussionStatutEnum.OUVERT,
          actionId: 'cae.1.1.1',
        };

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'Filtered discussion',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(
          collectiviteId,
          referentielId,
          filters
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(1);
          expect(result.data.data[0].status).toBe(DiscussionStatutEnum.OUVERT);
          expect(result.data.data[0].actionId).toBe('cae.1.1.1');
        }
      });
    });

    describe('sorting and pagination', () => {
      it('should apply sorting options', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';
        const options: QueryOptionsType = {
          sort: [{ field: 'actionId', direction: 'asc' }],
          limit: 10,
          page: 1,
        };

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 2,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'First',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
          {
            id: 2,
            collectiviteId: 123,
            actionId: 'cae.2.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 2,
            messages: [
              {
                id: 200,
                discussionId: 2,
                message: 'Second',
                createdBy: 'user-2',
                createdAt: '2025-10-17T11:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(
          collectiviteId,
          referentielId,
          undefined,
          options
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(2);
        }
      });

      it('should apply pagination with page and limit', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';
        const options: QueryOptionsType = {
          page: 1,
          limit: 10,
        };

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'Paginated result',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(
          collectiviteId,
          referentielId,
          undefined,
          options
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(1);
        }
      });

      it('should handle limit "all" option', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';
        const options: QueryOptionsType = {
          limit: 'all',
        };

        const mockQueryResult = Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          collectiviteId: 123,
          actionId: `cae.${i + 1}.1.1`,
          status: DiscussionStatutEnum.OUVERT,
          count: 50,
          messages: [
            {
              id: (i + 1) * 100,
              discussionId: i + 1,
              message: `Message ${i + 1}`,
              createdBy: 'user-1',
              createdAt: '2025-10-17T10:00:00.000Z',
            },
          ],
        }));

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(
          collectiviteId,
          referentielId,
          undefined,
          options
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(50);
          expect(result.data.count).toBe(50);
        }
      });
    });

    describe('error handling', () => {
      it('should return DATABASE_ERROR when query fails', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';

        vi.spyOn(service as any, 'getDiscussionsQuery').mockRejectedValue(
          new Error('Database connection error')
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
        }
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error listing discussions')
        );
      });

      it('should log error details when listing fails', async () => {
        const collectiviteId = 456;
        const referentielId: ReferentielEnum = 'eci';
        const error = new Error('Specific database error');

        vi.spyOn(service as any, 'getDiscussionsQuery').mockRejectedValue(
          error
        );

        await service.list(collectiviteId, referentielId);

        expect(mockLogger.error).toHaveBeenCalledWith(
          `Error listing discussions: ${error}`
        );
      });
    });

    describe('data transformation', () => {
      it('should correctly transform query results to DiscussionList format', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'Test message',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          const discussion = result.data.data[0];
          expect(discussion.id).toBe(1);
          expect(discussion.collectiviteId).toBe(123);
          expect(discussion.actionId).toBe('cae.1.1.1');
          expect(discussion.status).toBe(DiscussionStatutEnum.OUVERT);
          expect(discussion.createdBy).toBe('user-1');
          expect(discussion.createdAt).toBe('2025-10-17T10:00:00.000Z');
          expect(discussion.messages).toEqual(mockQueryResult[0].messages);
        }
      });

      it('should use first message for createdBy and createdAt in list', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'First message',
                createdBy: 'first-user',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
              {
                id: 101,
                discussionId: 1,
                message: 'Second message',
                createdBy: 'second-user',
                createdAt: '2025-10-17T11:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          const discussion = result.data.data[0];
          expect(discussion.createdBy).toBe('first-user');
          expect(discussion.createdAt).toBe('2025-10-17T10:00:00.000Z');
        }
      });

      it('should calculate total message count correctly', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 3,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'Message 1',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
              {
                id: 101,
                discussionId: 1,
                message: 'Message 2',
                createdBy: 'user-2',
                createdAt: '2025-10-17T11:00:00.000Z',
              },
            ],
          },
          {
            id: 2,
            collectiviteId: 123,
            actionId: 'cae.2.1.1',
            status: DiscussionStatutEnum.FERME,
            count: 3,
            messages: [
              {
                id: 200,
                discussionId: 2,
                message: 'Message 3',
                createdBy: 'user-3',
                createdAt: '2025-10-17T12:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.count).toBe(3); // 2 messages from first discussion + 1 from second
        }
      });
    });

    describe('different referentiels', () => {
      it('should list discussions for cae referentiel', async () => {
        const collectiviteId = 123;
        const referentielId: ReferentielEnum = 'cae';

        const mockQueryResult = [
          {
            id: 1,
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 100,
                discussionId: 1,
                message: 'CAE discussion',
                createdBy: 'user-1',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data[0].actionId).toContain('cae');
        }
      });

      it('should list discussions for eci referentiel', async () => {
        const collectiviteId = 456;
        const referentielId: ReferentielEnum = 'eci';

        const mockQueryResult = [
          {
            id: 2,
            collectiviteId: 456,
            actionId: 'eci.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 200,
                discussionId: 2,
                message: 'ECI discussion',
                createdBy: 'user-2',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data[0].actionId).toContain('eci');
        }
      });

      it('should list discussions for te referentiel', async () => {
        const collectiviteId = 789;
        const referentielId: ReferentielEnum = 'te';

        const mockQueryResult = [
          {
            id: 3,
            collectiviteId: 789,
            actionId: 'te.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            count: 1,
            messages: [
              {
                id: 300,
                discussionId: 3,
                message: 'TE discussion',
                createdBy: 'user-3',
                createdAt: '2025-10-17T10:00:00.000Z',
              },
            ],
          },
        ];

        vi.spyOn(service as any, 'getDiscussionsQuery').mockResolvedValue(
          mockQueryResult
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data[0].actionId).toContain('te');
        }
      });
    });
  });
});
