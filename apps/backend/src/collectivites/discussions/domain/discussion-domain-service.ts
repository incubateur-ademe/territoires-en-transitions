import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  getTableColumns,
  like,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
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

@Injectable()
export class DiscussionDomainService {
  constructor(
    @Inject('DiscussionRepository')
    private readonly discussionRepository: DiscussionRepository,
    @Inject('DiscussionMessageRepository')
    private readonly discussionMessageRepository: DiscussionMessageRepository,
    private readonly databaseService: DatabaseService,
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
    Result<{ data: DiscussionList[]; count: number }, DiscussionError>
  > {
    return await this.listDiscussionsQuery(
      collectiviteId,
      referentielId,
      filters,
      options
    );
  }

  private async listDiscussionsQuery(
    collectiviteId: number,
    referentielId: ReferentielEnum,
    filters?: ListDiscussionsRequestFilters,
    options?: QueryOptionsType
  ): Promise<
    Result<{ data: DiscussionList[]; count: number }, DiscussionError>
  > {
    try {
      const discussionsQueryResult = await this.getDiscussionsQuery(
        collectiviteId,
        referentielId,
        filters,
        options
      );

      const discussions = this.toDiscussionResponseList(discussionsQueryResult);

      const totalMessages = discussions.reduce(
        (acc, discussion) => acc + discussion.messages.length,
        0
      );

      this.logger.log(
        `Successfully listed ${discussions.length} discussions for collectivité ${collectiviteId} (total: ${totalMessages})`
      );

      return {
        success: true,
        data: {
          data: discussions,
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

  private toDiscussionResponseList(
    discussionsQueryResult: Awaited<
      ReturnType<DiscussionDomainService['getDiscussionsQuery']>
    >
  ): DiscussionList[] {
    return discussionsQueryResult.map((discussion) => ({
      id: discussion.id,
      collectiviteId: discussion.collectiviteId,
      actionId: discussion.actionId,
      status: discussion.status,
      createdBy: discussion.messages[0]?.createdBy || '',
      createdAt: discussion.messages[0]?.createdAt || '',
      messages: discussion.messages,
    }));
  }

  private async getDiscussionsQuery(
    collectiviteId: number,
    referentielId: ReferentielEnum,
    filters?: ListDiscussionsRequestFilters,
    options?: QueryOptionsType
  ) {
    const conditions: (SQL | SQLWrapper | undefined)[] = [
      eq(discussionTable.collectiviteId, collectiviteId),
      like(discussionTable.actionId, `${referentielId}%`),
    ];

    // Apply filters
    if (filters?.status) {
      conditions.push(eq(discussionTable.status, filters.status));
    }

    if (filters?.actionId) {
      conditions.push(eq(discussionTable.actionId, filters.actionId));
    }

    const query = this.databaseService.db
      .select({
        id: discussionTable.id,
        collectiviteId: discussionTable.collectiviteId,
        actionId: discussionTable.actionId,
        status: discussionTable.status,
        messages: sql<DiscussionMessageType[]>`(select ${getTableColumns(
          discussionMessageTable
        )} from ${discussionMessageTable} where ${
          discussionMessageTable.discussionId
        } = ${discussionTable.id})`.as('messages'),
      })
      .from(discussionTable)
      .where(and(...conditions));

    // Apply sorting
    if (options?.sort) {
      options.sort.forEach((sort) => {
        const column =
          sort.field === 'actionId'
            ? discussionTable.actionId
            : sort.field === 'created_at'
            ? discussionTable.createdAt
            : discussionTable.status;

        query.orderBy(sort.direction === 'asc' ? column : desc(column));
      });
    }

    // Apply pagination
    if (options && 'limit' in options && options.limit !== 'all') {
      if ('page' in options) {
        query.limit(options.limit).offset((options.page - 1) * options.limit);
      }
    }

    return await query;
  }
}
