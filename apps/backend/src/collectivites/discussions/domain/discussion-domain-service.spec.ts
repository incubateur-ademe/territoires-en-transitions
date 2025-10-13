import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DiscussionMessageRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-message-repository.interface';
import { DiscussionRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-repository.interface';
import { DiscussionDomainService } from './discussion-domain-service';
import {
  CreateDiscussionData,
  DiscussionErrorEnum,
  DiscussionStatutEnum,
  DiscussionType,
  ReferentielEnum,
} from './discussion.type';

describe('DiscussionDomainService', () => {
  let service: DiscussionDomainService;
  let mockDiscussionRepository: DiscussionRepository;
  let mockDiscussionMessageRepository: DiscussionMessageRepository;
  let mockLogger: Logger;

  const mockDiscussion: DiscussionType = {
    id: 1,
    collectiviteId: 123,
    actionId: 'action-1',
    status: DiscussionStatutEnum.OUVERT,
    createdBy: 'user-id-1',
    createdAt: '2025-01-01T00:00:00.000Z',
    modifiedAt: '2025-01-01T00:00:00.000Z',
  };

  const mockMessage = {
    id: 1,
    discussionId: 1,
    message: 'Test message',
    createdBy: 'user-id-1',
    createdByNom: 'Test User',
    createdAt: '2025-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    mockDiscussionRepository = {
      findById: vi.fn(),
      findOrCreate: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
    } as unknown as DiscussionRepository;

    mockDiscussionMessageRepository = {
      create: vi.fn(),
      delete: vi.fn(),
      findByDiscussionIds: vi.fn(),
    } as unknown as DiscussionMessageRepository;

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn(),
    } as unknown as Logger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionDomainService,
        {
          provide: 'DiscussionRepository',
          useValue: mockDiscussionRepository,
        },
        {
          provide: 'DiscussionMessageRepository',
          useValue: mockDiscussionMessageRepository,
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

  describe('insert', () => {
    const createDiscussionData: CreateDiscussionData = {
      collectiviteId: 123,
      actionId: 'action-1',
      message: 'Test message',
      createdBy: 'user-id-1',
    };

    test('should create a new discussion and message when discussionId is not provided', async () => {
      vi.mocked(mockDiscussionRepository.findOrCreate).mockResolvedValue({
        success: true,
        data: mockDiscussion,
      });

      vi.mocked(mockDiscussionMessageRepository.create).mockResolvedValue({
        success: true,
        data: mockMessage,
      });

      const result = await service.insert(createDiscussionData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.messageId).toBe(1);
        expect(result.data.message).toBe('Test message');
      }

      expect(mockDiscussionRepository.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          collectiviteId: 123,
          actionId: 'action-1',
          createdBy: 'user-id-1',
          message: 'Test message',
        }),
        undefined
      );

      expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith(
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

      vi.mocked(mockDiscussionRepository.findById).mockResolvedValue({
        success: true,
        data: mockDiscussion,
      });

      vi.mocked(mockDiscussionMessageRepository.create).mockResolvedValue({
        success: true,
        data: mockMessage,
      });

      const result = await service.insert(dataWithDiscussionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
      expect(mockDiscussionRepository.findById).toHaveBeenCalledWith(1);
      expect(mockDiscussionMessageRepository.create).toHaveBeenCalled();
    });

    test('should return error when discussion is not found', async () => {
      const dataWithDiscussionId: CreateDiscussionData = {
        ...createDiscussionData,
        discussionId: 999,
      };

      vi.mocked(mockDiscussionRepository.findById).mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.NOT_FOUND,
      });

      const result = await service.insert(dataWithDiscussionId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.NOT_FOUND);
      }
    });

    test('should return error when message creation fails', async () => {
      vi.mocked(mockDiscussionRepository.findOrCreate).mockResolvedValue({
        success: true,
        data: mockDiscussion,
      });

      vi.mocked(mockDiscussionMessageRepository.create).mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.insert(createDiscussionData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });
  });

  describe('deleteDiscussionMessage', () => {
    test('should delete a discussion message', async () => {
      vi.mocked(mockDiscussionMessageRepository.delete).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await service.deleteDiscussionMessage(1);

      expect(result.success).toBe(true);
      expect(mockDiscussionMessageRepository.delete).toHaveBeenCalledWith(1);
    });

    test('should return error when deletion fails', async () => {
      vi.mocked(mockDiscussionMessageRepository.delete).mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.deleteDiscussionMessage(1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });
  });

  describe('updateDiscussion', () => {
    test('should update discussion status', async () => {
      const updatedDiscussion = {
        ...mockDiscussion,
        status: DiscussionStatutEnum.FERME,
      };

      vi.mocked(mockDiscussionRepository.update).mockResolvedValue({
        success: true,
        data: updatedDiscussion,
      });

      const result = await service.updateDiscussion(
        1,
        DiscussionStatutEnum.FERME
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe(DiscussionStatutEnum.FERME);
      }
      expect(mockDiscussionRepository.update).toHaveBeenCalledWith(
        1,
        DiscussionStatutEnum.FERME
      );
    });

    test('should return error when update fails', async () => {
      vi.mocked(mockDiscussionRepository.update).mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.updateDiscussion(
        1,
        DiscussionStatutEnum.FERME
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });
  });

  describe('list', () => {
    const mockDiscussionWithActionName = {
      ...mockDiscussion,
      actionNom: 'Action name',
      actionIdentifiant: 'action-1',
    };

    test('should list discussions with their messages', async () => {
      vi.mocked(mockDiscussionRepository.list).mockResolvedValue({
        success: true,
        data: [mockDiscussionWithActionName],
      });

      vi.mocked(
        mockDiscussionMessageRepository.findByDiscussionIds
      ).mockResolvedValue({
        success: true,
        data: [mockMessage],
      });

      const result = await service.list(123, 'cae' as ReferentielEnum);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data[0].actionNom).toBe('Action name');
        expect(result.data.data[0].actionIdentifiant).toBe('action-1');
        expect(result.data.data[0].messages).toHaveLength(1);
        expect(result.data.count).toBe(1);
      }

      expect(mockDiscussionRepository.list).toHaveBeenCalledWith(
        123,
        'cae',
        undefined,
        undefined
      );
    });

    test('should return empty list when no discussions found', async () => {
      vi.mocked(mockDiscussionRepository.list).mockResolvedValue({
        success: true,
        data: [],
      });

      vi.mocked(
        mockDiscussionMessageRepository.findByDiscussionIds
      ).mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await service.list(123, 'cae' as ReferentielEnum);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toHaveLength(0);
        expect(result.data.count).toBe(0);
      }
    });

    test('should return error when discussion list fails', async () => {
      vi.mocked(mockDiscussionRepository.list).mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.list(123, 'cae' as ReferentielEnum);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });

    test('should return error when message fetching fails', async () => {
      vi.mocked(mockDiscussionRepository.list).mockResolvedValue({
        success: true,
        data: [mockDiscussionWithActionName],
      });

      vi.mocked(
        mockDiscussionMessageRepository.findByDiscussionIds
      ).mockResolvedValue({
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      });

      const result = await service.list(123, 'cae' as ReferentielEnum);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(DiscussionErrorEnum.DATABASE_ERROR);
      }
    });
  });
});
