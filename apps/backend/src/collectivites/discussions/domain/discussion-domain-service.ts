import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { DiscussionMessageRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-message-repository.interface';
import { DiscussionRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-repository.interface';
import {
  CreateDiscussionData,
  CreateDiscussionResponse,
  DiscussionError,
  DiscussionErrorEnum,
  DiscussionType,
  Result,
} from './discussion.type';

@Injectable()
export class DiscussionDomainService {
  constructor(
    @Inject('DiscussionRepository')
    private readonly discussionRepository: DiscussionRepository,
    @Inject('DiscussionMessageRepository')
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
    }

    // Now create the discussion message
    const discussionMessageData = {
      discussionId: discussion.data.id,
      message: discussionData.message,
      createdBy: discussionData.createdBy,
      createdAt: new Date().toISOString(),
    };

    const newDiscussionMessage = await this.discussionMessageRepository.create(
      discussionMessageData,
      tx
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
        id: discussion.data.id,
        messageId: newDiscussionMessage.data.id,
        collectiviteId: discussion.data.collectiviteId,
        actionId: discussion.data.actionId,
        status: discussion.data.status,
        createdBy: discussionMessageData.createdBy,
        createdAt: discussionMessageData.createdAt,
        message: newDiscussionMessage.data.message,
      },
    };
  }

  async deleteDiscussionMessage(
    discussionMessageId: number
  ): Promise<Result<void, DiscussionError>> {
    return await this.discussionMessageRepository.delete(discussionMessageId);
  }

  async list(
    collectiviteId: number,
    referentielId: ReferentielEnum,
    filters?: ListDiscussionsRequestFilters,
    options?: QueryOptionsType
  ): Promise<
    Result<{ data: DiscussionMessages[]; count: number }, DiscussionError>
  > {
    try {
      const discussionsListWithMessagesResult =
        await this.getDiscussionsListWithMessages(
          collectiviteId,
          referentielId,
          filters,
          options
        );

      if (!discussionsListWithMessagesResult.success) {
        this.logger.error('Error fetching discussions with messages');
        return {
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        };
      }

      const totalMessages = discussionsListWithMessagesResult.data.reduce(
        (acc, discussion) => acc + discussion.messages.length,
        0
      );

      this.logger.log(
        `Successfully listed ${discussionsListWithMessagesResult.data.length} discussions for collectivité ${collectiviteId} (total: ${totalMessages})`
      );

      return {
        success: true,
        data: {
          data: discussionsListWithMessagesResult.data,
          count: totalMessages,
        },
      };
    } catch (error) {
      this.logger.error(`Error listing discussions: ${error}`);
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }

  private async getDiscussionsListWithMessages(
    collectiviteId: number,
    referentielId: ReferentielEnum,
    filters?: ListDiscussionsRequestFilters,
    options?: QueryOptionsType
  ): Promise<Result<DiscussionMessages[], DiscussionError>> {
    // Fetch discussions from repository
    const discussionsResult = await this.discussionRepository.list(
      collectiviteId,
      referentielId,
      filters,
      options
    );

    if (!discussionsResult.success) {
      this.logger.error('Error fetching discussions from repository');
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }

    const discussions: DiscussionWithActionName[] = discussionsResult.data;

    // Fetch all messages for these discussions in a single query (avoiding N+1)
    const discussionIds: number[] = discussions.map(
      (d: DiscussionType) => d.id
    );
    const messagesResult: Result<DiscussionMessageType[], DiscussionError> =
      await this.discussionMessageRepository.findByDiscussionIds(discussionIds);

    if (!messagesResult.success) {
      this.logger.error('Error fetching discussion messages');
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }

    // Group messages by discussionId for efficient lookup
    const messagesByDiscussionId = new Map<number, DiscussionMessageType[]>();
    messagesResult.data.forEach((message: DiscussionMessageType) => {
      const existing: DiscussionMessageType[] =
        messagesByDiscussionId.get(message.discussionId) || [];
      existing.push(message);
      messagesByDiscussionId.set(message.discussionId, existing);
    });

    // Combine discussions with their messages and return as a successful Result
    return {
      success: true,
      data: discussions.map((discussion: DiscussionWithActionName) => {
        return {
          ...discussion,
          createdBy: discussion.createdBy ?? '',
          messages: messagesByDiscussionId.get(discussion.id) || [],
        };
      }),
    };
  }
}
