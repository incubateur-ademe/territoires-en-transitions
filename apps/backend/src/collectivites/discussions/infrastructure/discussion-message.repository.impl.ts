import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { eq, getTableColumns, inArray } from 'drizzle-orm';
import { DiscussionMessageRepository } from '../domain/discussion-message-repository.interface';
import {
  CreateDiscussionMessageType,
  DiscussionError,
  DiscussionErrorEnum,
  discussionMessageTable,
  DiscussionMessageType,
  Result as GenericResult,
} from '../domain/discussion.type';

type Result<T> = GenericResult<T, DiscussionError>;

@Injectable()
export class DiscussionMessageRepositoryImpl
  implements DiscussionMessageRepository
{
  private readonly logger = new Logger(DiscussionMessageRepositoryImpl.name);
  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    discussionMessage: CreateDiscussionMessageType,
    tx?: Transaction
  ): Promise<Result<DiscussionMessageType>> {
    try {
      const result = await (tx ?? this.databaseService.db)
        .insert(discussionMessageTable)
        .values(discussionMessage)
        .returning();
      if (!result || result.length === 0) {
        this.logger.error(
          `Error creating discussion message: ${JSON.stringify(
            discussionMessage
          )}`
        );
        return {
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        };
      }
      const [createdDiscussionMessage] = result;
      this.logger.log(
        `Successfully created discussion message ${createdDiscussionMessage.id}`
      );
      return {
        success: true,
        data: createdDiscussionMessage,
      };
    } catch (error) {
      this.logger.error(`Error creating discussion message: ${error}`);
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }

  async findByDiscussionIds(
    discussionIds: number[]
  ): Promise<Result<DiscussionMessageType[]>> {
    try {
      const discussionMessages = await this.databaseService.db
        .select({
          ...getTableColumns(discussionMessageTable),
        })
        .from(discussionMessageTable)
        .where(inArray(discussionMessageTable.discussionId, discussionIds));
      return {
        success: true,
        data: discussionMessages,
      };
    } catch (error) {
      this.logger.error(
        `Error finding discussion messages by discussion ids: ${error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }

  async delete(
    discussionMessageId: number,
    tx?: Transaction
  ): Promise<Result<void>> {
    try {
      await (tx ?? this.databaseService.db)
        .delete(discussionMessageTable)
        .where(eq(discussionMessageTable.id, discussionMessageId));
      this.logger.log(
        `Successfully deleted discussion message ${discussionMessageId}`
      );
      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      this.logger.error(`Error deleting discussion message: ${error}`);
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }
}
