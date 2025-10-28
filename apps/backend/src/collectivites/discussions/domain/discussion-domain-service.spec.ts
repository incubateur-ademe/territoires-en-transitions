import { DatabaseService } from '@/backend/utils/database/database.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { DiscussionDomainService } from './discussion-domain-service';
import {
  CreateDiscussionData,
  DiscussionErrorEnum,
  DiscussionMessageType,
  DiscussionStatutEnum,
  DiscussionType,
  ReferentielEnum,
} from './discussion.type';

describe('DiscussionDomainService', () => {
  // Helper function to create module with custom mocks
  async function createTestModule(mocks: {
    discussionRepository?: any;
    discussionMessageRepository?: any;
    databaseService?: any;
    logger?: any;
  }): Promise<TestingModule> {
    const defaultLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn(),
    };

    return Test.createTestingModule({
      providers: [
        DiscussionDomainService,
        {
          provide: 'DiscussionRepository',
          useValue: mocks.discussionRepository || {},
        },
        {
          provide: 'DiscussionMessageRepository',
          useValue: mocks.discussionMessageRepository || {},
        },
        {
          provide: DatabaseService,
          useValue: mocks.databaseService || {},
        },
        {
          provide: Logger,
          useValue: mocks.logger || defaultLogger,
        },
      ],
    }).compile();
  }

  const mockDiscussion: DiscussionType = {
    id: 1,
    collectiviteId: 123,
    actionId: 'cae_1.1.1',
    status: DiscussionStatutEnum.OUVERT,
    createdBy: 'user-id-1',
    createdAt: '2024-01-01T00:00:00Z',
    modifiedAt: '2024-01-01T00:00:00Z',
  };

  const mockDiscussionMessage: DiscussionMessageType = {
    id: 1,
    discussionId: 1,
    message: 'Test message',
    createdBy: 'user-id-1',
    createdAt: '2024-01-01T00:00:00Z',
  };

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

        const mockDiscussionMessageRepository = {
          create: vi.fn().mockResolvedValue({
            success: true,
            data: mockDiscussionMessage,
          }),
        };

        const mockLogger = {
          log: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          verbose: vi.fn(),
        };

        const module = await createTestModule({
          discussionRepository: mockDiscussionRepository,
          discussionMessageRepository: mockDiscussionMessageRepository,
          logger: mockLogger,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.insert(createDiscussionData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toMatchObject({
            id: mockDiscussion.id,
            messageId: mockDiscussionMessage.id,
            collectiviteId: mockDiscussion.collectiviteId,
            actionId: mockDiscussion.actionId,
            status: mockDiscussion.status,
            createdBy: mockDiscussionMessage.createdBy,
            message: mockDiscussionMessage.message,
          });
          expect(result.data.createdAt).toBeDefined();
          expect(typeof result.data.createdAt).toBe('string');
        }
        expect(mockDiscussionRepository.findOrCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            collectiviteId: createDiscussionData.collectiviteId,
            actionId: createDiscussionData.actionId,
            createdBy: createDiscussionData.createdBy,
            status: DiscussionStatutEnum.OUVERT,
          }),
          undefined
        );
        expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            discussionId: mockDiscussion.id,
            message: createDiscussionData.message,
            createdBy: createDiscussionData.createdBy,
          }),
          undefined
        );
        expect(mockDiscussionRepository.findById).not.toHaveBeenCalled();
      });
    });

    describe('successful insertion with existing discussion', () => {
      it('should successfully add a message to an existing discussion', async () => {
        const createDataWithDiscussionId: CreateDiscussionData = {
          ...createDiscussionData,
          discussionId: 1,
        };

        const mockDiscussionRepository = {
          findById: vi.fn().mockResolvedValue({
            success: true,
            data: mockDiscussion,
          }),
          findOrCreate: vi.fn(),
        };

        const mockDiscussionMessageRepository = {
          create: vi.fn().mockResolvedValue({
            success: true,
            data: mockDiscussionMessage,
          }),
        };

        const module = await createTestModule({
          discussionRepository: mockDiscussionRepository,
          discussionMessageRepository: mockDiscussionMessageRepository,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.insert(createDataWithDiscussionId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(mockDiscussion.id);
          expect(result.data.messageId).toBe(mockDiscussionMessage.id);
        }
        expect(mockDiscussionRepository.findById).toHaveBeenCalledWith(1);
        expect(mockDiscussionMessageRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            discussionId: mockDiscussion.id,
            message: createDiscussionData.message,
            createdBy: createDiscussionData.createdBy,
          }),
          undefined
        );
        expect(mockDiscussionRepository.findOrCreate).not.toHaveBeenCalled();
      });
    });

    describe('discussion not found', () => {
      it('should return NOT_FOUND error when discussion with provided id does not exist', async () => {
        const createDataWithInvalidId: CreateDiscussionData = {
          ...createDiscussionData,
          discussionId: 999,
        };

        const mockDiscussionRepository = {
          findById: vi.fn().mockResolvedValue({
            success: false,
            error: DiscussionErrorEnum.NOT_FOUND,
          }),
          findOrCreate: vi.fn(),
        };

        const mockDiscussionMessageRepository = {
          create: vi.fn(),
        };

        const mockLogger = {
          log: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          verbose: vi.fn(),
        };

        const module = await createTestModule({
          discussionRepository: mockDiscussionRepository,
          discussionMessageRepository: mockDiscussionMessageRepository,
          logger: mockLogger,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.insert(createDataWithInvalidId);

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.NOT_FOUND,
        });
        expect(mockDiscussionRepository.findById).toHaveBeenCalledWith(999);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Discussion with id 999 not found'
        );
        expect(mockDiscussionMessageRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('findOrCreate fails', () => {
      it('should return DATABASE_ERROR when findOrCreate fails', async () => {
        const mockDiscussionRepository = {
          findOrCreate: vi.fn().mockResolvedValue({
            success: false,
            error: DiscussionErrorEnum.DATABASE_ERROR,
          }),
          findById: vi.fn(),
        };

        const mockDiscussionMessageRepository = {
          create: vi.fn(),
        };

        const mockLogger = {
          log: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          verbose: vi.fn(),
        };

        const module = await createTestModule({
          discussionRepository: mockDiscussionRepository,
          discussionMessageRepository: mockDiscussionMessageRepository,
          logger: mockLogger,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.insert(createDiscussionData);

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });
        expect(mockDiscussionRepository.findOrCreate).toHaveBeenCalled();
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error finding or creating discussion')
        );
        expect(mockDiscussionMessageRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('message creation fails', () => {
      it('should return DATABASE_ERROR when message creation fails', async () => {
        const mockDiscussionRepository = {
          findOrCreate: vi.fn().mockResolvedValue({
            success: true,
            data: mockDiscussion,
          }),
          findById: vi.fn(),
        };

        const mockDiscussionMessageRepository = {
          create: vi.fn().mockResolvedValue({
            success: false,
            error: DiscussionErrorEnum.DATABASE_ERROR,
          }),
        };

        const module = await createTestModule({
          discussionRepository: mockDiscussionRepository,
          discussionMessageRepository: mockDiscussionMessageRepository,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.insert(createDiscussionData);

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });
        expect(mockDiscussionRepository.findOrCreate).toHaveBeenCalled();
        expect(mockDiscussionMessageRepository.create).toHaveBeenCalled();
      });
    });
  });

  describe('deleteDiscussionMessage', () => {
    const discussionMessageId = 1;

    describe('successful deletion', () => {
      it('should successfully delete a discussion message', async () => {
        const mockDiscussionMessageRepository = {
          delete: vi.fn().mockResolvedValue({
            success: true,
            data: undefined,
          }),
        };

        const module = await createTestModule({
          discussionMessageRepository: mockDiscussionMessageRepository,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.deleteDiscussionMessage(
          discussionMessageId
        );

        expect(result).toEqual({
          success: true,
          data: undefined,
        });
        expect(mockDiscussionMessageRepository.delete).toHaveBeenCalledWith(
          discussionMessageId
        );
      });
    });

    describe('deletion fails', () => {
      it('should return error when deletion fails', async () => {
        const mockDiscussionMessageRepository = {
          delete: vi.fn().mockResolvedValue({
            success: false,
            error: DiscussionErrorEnum.DATABASE_ERROR,
          }),
        };

        const module = await createTestModule({
          discussionMessageRepository: mockDiscussionMessageRepository,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.deleteDiscussionMessage(
          discussionMessageId
        );

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });
        expect(mockDiscussionMessageRepository.delete).toHaveBeenCalledWith(
          discussionMessageId
        );
      });
    });
  });

  describe('list', () => {
    const collectiviteId = 123;
    const referentielId: ReferentielEnum = 'cae';

    const mockDiscussionsQueryResult = [
      {
        id: 1,
        collectiviteId: 123,
        actionId: 'cae_1.1.1',
        status: DiscussionStatutEnum.OUVERT,
      },
      {
        id: 2,
        collectiviteId: 123,
        actionId: 'cae_1.1.2',
        status: DiscussionStatutEnum.OUVERT,
      },
    ];

    const mockMessages = [
      mockDiscussionMessage,
      {
        id: 2,
        discussionId: 2,
        message: 'Test message 2',
        createdBy: 'user-id-2',
        createdAt: '2024-01-02T00:00:00Z',
      },
    ];

    describe('successful listing', () => {
      it('should successfully list discussions', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            resolve(mockDiscussionsQueryResult);
            return Promise.resolve(mockDiscussionsQueryResult);
          }),
        };

        const mockDatabaseService = {
          db: {
            select: vi.fn().mockReturnValue(mockQuery),
          },
        };

        const mockDiscussionMessageRepository = {
          findByDiscussionIds: vi.fn().mockResolvedValue({
            success: true,
            data: mockMessages,
          }),
        };

        const mockLogger = {
          log: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          verbose: vi.fn(),
        };

        const module = await createTestModule({
          databaseService: mockDatabaseService,
          discussionMessageRepository: mockDiscussionMessageRepository,
          logger: mockLogger,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(2);
          expect(result.data.count).toBe(2);
          expect(result.data.data[0]).toEqual({
            id: 1,
            collectiviteId: 123,
            actionId: 'cae_1.1.1',
            status: DiscussionStatutEnum.OUVERT,
            createdBy: mockDiscussionMessage.createdBy,
            createdAt: mockDiscussionMessage.createdAt,
            messages: [mockDiscussionMessage],
          });
        }
        expect(
          mockDiscussionMessageRepository.findByDiscussionIds
        ).toHaveBeenCalledWith([1, 2]);
        expect(mockLogger.log).toHaveBeenCalledWith(
          expect.stringContaining('Successfully listed 2 discussions')
        );
      });

      it('should successfully list discussions with filters', async () => {
        const filters = {
          status: DiscussionStatutEnum.OUVERT,
          actionId: 'cae_1.1.1',
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            resolve([mockDiscussionsQueryResult[0]]);
            return Promise.resolve([mockDiscussionsQueryResult[0]]);
          }),
        };

        const mockDatabaseService = {
          db: {
            select: vi.fn().mockReturnValue(mockQuery),
          },
        };

        const mockDiscussionMessageRepository = {
          findByDiscussionIds: vi.fn().mockResolvedValue({
            success: true,
            data: [mockMessages[0]],
          }),
        };

        const module = await createTestModule({
          databaseService: mockDatabaseService,
          discussionMessageRepository: mockDiscussionMessageRepository,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.list(
          collectiviteId,
          referentielId,
          filters
        );

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(1);
          expect(result.data.data[0].actionId).toBe('cae_1.1.1');
        }
      });

      it('should successfully list discussions with pagination', async () => {
        const options = {
          limit: 10,
          page: 1,
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            resolve(mockDiscussionsQueryResult);
            return Promise.resolve(mockDiscussionsQueryResult);
          }),
        };

        const mockDatabaseService = {
          db: {
            select: vi.fn().mockReturnValue(mockQuery),
          },
        };

        const mockDiscussionMessageRepository = {
          findByDiscussionIds: vi.fn().mockResolvedValue({
            success: true,
            data: mockMessages,
          }),
        };

        const module = await createTestModule({
          databaseService: mockDatabaseService,
          discussionMessageRepository: mockDiscussionMessageRepository,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
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
        expect(mockQuery.limit).toHaveBeenCalledWith(10);
        expect(mockQuery.offset).toHaveBeenCalledWith(0);
      });

      it('should successfully list discussions with sorting', async () => {
        const options = {
          limit: 10,
          page: 1,
          sort: [{ field: 'actionId' as const, direction: 'asc' as const }],
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            resolve(mockDiscussionsQueryResult);
            return Promise.resolve(mockDiscussionsQueryResult);
          }),
        };

        const mockDatabaseService = {
          db: {
            select: vi.fn().mockReturnValue(mockQuery),
          },
        };

        const mockDiscussionMessageRepository = {
          findByDiscussionIds: vi.fn().mockResolvedValue({
            success: true,
            data: mockMessages,
          }),
        };

        const module = await createTestModule({
          databaseService: mockDatabaseService,
          discussionMessageRepository: mockDiscussionMessageRepository,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.list(
          collectiviteId,
          referentielId,
          undefined,
          options
        );

        expect(result.success).toBe(true);
        expect(mockQuery.orderBy).toHaveBeenCalled();
      });
    });

    describe('listing fails', () => {
      it('should return discussions with empty messages when message fetching fails', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            resolve(mockDiscussionsQueryResult);
            return Promise.resolve(mockDiscussionsQueryResult);
          }),
        };

        const mockDatabaseService = {
          db: {
            select: vi.fn().mockReturnValue(mockQuery),
          },
        };

        const mockDiscussionMessageRepository = {
          findByDiscussionIds: vi.fn().mockResolvedValue({
            success: false,
            error: DiscussionErrorEnum.DATABASE_ERROR,
          }),
        };

        const mockLogger = {
          log: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          verbose: vi.fn(),
        };

        const module = await createTestModule({
          databaseService: mockDatabaseService,
          discussionMessageRepository: mockDiscussionMessageRepository,
          logger: mockLogger,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(2);
          expect(result.data.data[0].messages).toEqual([]);
          expect(result.data.data[1].messages).toEqual([]);
        }
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error fetching discussion messages'
        );
      });

      it('should return DATABASE_ERROR when query fails', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve, reject) => {
            reject(new Error('Database error'));
            return Promise.reject(new Error('Database error'));
          }),
        };

        const mockDatabaseService = {
          db: {
            select: vi.fn().mockReturnValue(mockQuery),
          },
        };

        const mockLogger = {
          log: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          verbose: vi.fn(),
        };

        const module = await createTestModule({
          databaseService: mockDatabaseService,
          logger: mockLogger,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result).toEqual({
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        });
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error listing discussions')
        );
      });
    });

    describe('empty results', () => {
      it('should successfully return empty list when no discussions found', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            resolve([]);
            return Promise.resolve([]);
          }),
        };

        const mockDatabaseService = {
          db: {
            select: vi.fn().mockReturnValue(mockQuery),
          },
        };

        const mockLogger = {
          log: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn(),
          verbose: vi.fn(),
        };

        const module = await createTestModule({
          databaseService: mockDatabaseService,
          logger: mockLogger,
        });

        const service = module.get<DiscussionDomainService>(
          DiscussionDomainService
        );

        const result = await service.list(collectiviteId, referentielId);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.data).toHaveLength(0);
          expect(result.data.count).toBe(0);
        }
        expect(mockLogger.log).toHaveBeenCalledWith(
          expect.stringContaining('Successfully listed 0 discussions')
        );
      });
    });
  });
});
