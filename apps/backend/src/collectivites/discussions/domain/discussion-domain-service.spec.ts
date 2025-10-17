import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscussionDomainService } from './discussion-domain-service';
import {
  CreateDiscussionData,
  DiscussionErrorEnum,
  DiscussionMessageType,
  DiscussionStatutEnum,
  DiscussionType,
} from './discussion.type';

describe('DiscussionDomainService', () => {
  let service: DiscussionDomainService;
  let mockDiscussionRepository: any;
  let mockDiscussionMessageRepository: any;
  let mockLogger: any;

  beforeEach(() => {
    // Mock repositories and logger
    mockDiscussionRepository = {
      create: vi.fn(),
      findById: vi.fn(),
    };

    mockDiscussionMessageRepository = {
      create: vi.fn(),
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
      mockLogger as Logger
    );
  });

  describe('insert', () => {
    describe('when discussion does not exist', () => {
      it('should create a new discussion and message successfully', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 1,
          collectiviteId: 123,
          actionId: 'cae.1.1.1',
          message: 'Test message',
          createdBy: 'user-id-123',
        };

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

        mockDiscussionRepository.findById.mockResolvedValue(null);
        mockDiscussionRepository.create.mockResolvedValue({
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

        expect(mockDiscussionRepository.findById).toHaveBeenCalledWith(1);
        expect(mockDiscussionRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            collectiviteId: 123,
            actionId: 'cae.1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            createdBy: 'user-id-123',
          })
        );
        expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            discussionId: 1,
            collectiviteId: 123,
            message: 'Test message',
            createdBy: 'user-id-123',
          })
        );
      });

      it('should set status to OUVERT when creating new discussion', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 2,
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

        mockDiscussionRepository.findById.mockResolvedValue(null);
        mockDiscussionRepository.create.mockResolvedValue({
          success: true,
          data: createdDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        await service.insert(discussionData);

        expect(mockDiscussionRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            status: DiscussionStatutEnum.OUVERT,
          })
        );
      });

      it('should set timestamps when creating new discussion', async () => {
        const discussionData: CreateDiscussionData = {
          discussionId: 3,
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

        mockDiscussionRepository.findById.mockResolvedValue(null);
        mockDiscussionRepository.create.mockResolvedValue({
          success: true,
          data: createdDiscussion,
        });
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        await service.insert(discussionData);

        const createCall = mockDiscussionRepository.create.mock.calls[0][0];
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

        mockDiscussionRepository.findById.mockResolvedValue(existingDiscussion);
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
          })
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

        mockDiscussionRepository.findById.mockResolvedValue(existingDiscussion);
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
          discussionId: 10,
          collectiviteId: 999,
          actionId: 'cae.10.1.1',
          message: 'Test message',
          createdBy: 'user-id-999',
        };

        mockDiscussionRepository.findById.mockResolvedValue(null);
        mockDiscussionRepository.create.mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });

        const result = await service.insert(discussionData);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
        }

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error creating discussion')
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

        mockDiscussionRepository.findById.mockResolvedValue(existingDiscussion);
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
          discussionId: 12,
          collectiviteId: 777,
          actionId: 'cae.12.1.1',
          message: 'Test message',
          createdBy: 'user-id-777',
        };

        mockDiscussionRepository.findById.mockResolvedValue(null);
        mockDiscussionRepository.create.mockResolvedValue({
          success: false,
          error: DiscussionErrorEnum.SERVER_ERROR,
        });

        await service.insert(discussionData);

        expect(mockLogger.error).toHaveBeenCalledWith(
          `Error creating discussion: ${DiscussionErrorEnum.SERVER_ERROR}`
        );
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

        mockDiscussionRepository.findById.mockResolvedValue(existingDiscussion);
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        await service.insert(discussionData);

        expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith({
          discussionId: 20,
          collectiviteId: 100,
          message: 'Mapping test message',
          createdBy: 'test-user',
          createdAt: expect.any(String),
        });
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

        mockDiscussionRepository.findById.mockResolvedValue(existingDiscussion);
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
      it('should accept and pass transaction parameter', async () => {
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

        mockDiscussionRepository.findById.mockResolvedValue(existingDiscussion);
        mockDiscussionMessageRepository.create.mockResolvedValue({
          success: true,
          data: createdMessage,
        });

        const result = await service.insert(discussionData, mockTransaction);

        expect(result.success).toBe(true);
        // The transaction parameter is accepted but not currently used in the repositories
        // This test verifies the signature accepts it
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

        mockDiscussionRepository.findById.mockResolvedValue(existingDiscussion);
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

        mockDiscussionRepository.findById.mockResolvedValue(existingDiscussion);
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
          discussionId: 60,
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

        mockDiscussionRepository.findById.mockResolvedValue(null);
        mockDiscussionRepository.create.mockResolvedValue({
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
});
