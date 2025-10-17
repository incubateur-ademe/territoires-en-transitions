import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { DiscussionMessageRepository } from './discussion-message-repository.interface';
import { DiscussionRepository } from './discussion-repository.interface';
import {
  CreateDiscussionData,
  CreateDiscussionResponse,
  DiscussionError,
  DiscussionErrorEnum,
  DiscussionType,
  Result,
} from './discussion.type';

// Erreurs liées à la persistance du domaine
class DiscussionNotFound extends Error {
  readonly _tag = 'DiscussionNotFound';
  constructor(public readonly discussionId: number) {
    super(`Discussion not found: ${discussionId}`);
    this.name = 'DiscussionNotFound';
  }
}
class PersistenceError extends Error {
  readonly _tag = 'PersistenceError';
  constructor(public readonly cause: unknown) {
    super(
      `Persistence error: ${
        cause instanceof Error ? cause.message : String(cause)
      }`
    );
    this.name = 'PersistenceError';
  }
}

type DiscussionDomainServiceError = PersistenceError | DiscussionNotFound;

@Injectable()
export class DiscussionDomainService {
  constructor(
    private readonly discussionRepository: DiscussionRepository,
    private readonly discussionMessageRepository: DiscussionMessageRepository,
    private readonly logger: Logger
  ) {}

  async insert(
    discussionData: CreateDiscussionData,
    tx?: Transaction
  ): Promise<Result<CreateDiscussionResponse, DiscussionError>> {
    let discussion: Result<DiscussionType, DiscussionError>;

    // If a discussionId is provided, use it to find the existing discussion
    if (discussionData.discussionId) {
      discussion = await this.discussionRepository.findById(
        discussionData.discussionId
      );
      if (!discussion.success) {
        this.logger.error(
          `Discussion avec l'id ${discussionData.discussionId} non trouvée`
        );
        return {
          success: false,
          error: discussion.error,
        };
      }
    } else {
      // If no discussionId provided, use findOrCreate to handle race conditions
      // This will either find an existing discussion or create a new one atomically
      discussion = await this.discussionRepository.findOrCreate(
        discussionData,
        tx
      );

      if (!discussion.success) {
        this.logger.error(
          `Erreur lors de la recherche ou de la création de la discussion: ${discussion.error}`
        );
        return {
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        };
      }
      discussion = newDiscussion.data;
    }
    // Now create the discussion message
    const discussionMessageData = {
      discussionId: discussion.id,
      collectiviteId: discussion.collectiviteId,
      message: discussionData.message,
      createdBy: discussionData.createdBy,
      createdAt: new Date().toISOString(),
    };
    const newDiscussionMessage = await this.discussionMessageRepository.create(
      discussionMessageData
    );
    if (!newDiscussionMessage.success) {
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
    return {
      success: true,
      data: {
        id: discussion.id,
        messageId: newDiscussionMessage.data.id,
        collectiviteId: discussion.collectiviteId,
        actionId: discussion.actionId,
        status: discussion.status,
        createdBy: discussionMessageData.createdBy,
        createdAt: discussionMessageData.createdAt,
        message: newDiscussionMessage.data.message,
      },
    };
  }
}
