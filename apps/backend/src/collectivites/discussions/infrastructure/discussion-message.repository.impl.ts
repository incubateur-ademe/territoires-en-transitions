import { DatabaseService } from '@/backend/utils';
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
    discussionMessage: CreateDiscussionMessageType
  ): Promise<Result<DiscussionMessageType>> {
    try {
      const result = await this.databaseService.db
        .insert(discussionMessageTable)
        .values(discussionMessage)
        .returning();
      if (!result || result.length === 0) {
        return {
          success: false,
          error: DiscussionErrorEnum.SERVER_ERROR,
        };
      }
      const [createdDiscussionMessage] = result;
      this.logger.log(
        `Created discussion message ${createdDiscussionMessage.id}`
      );
      return {
        success: true,
        data: createdDiscussionMessage,
      };
    } catch (error) {
      this.logger.error(`Error creating discussion message: ${error}`);
      return {
        success: false,
        error: DiscussionErrorEnum.SERVER_ERROR,
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
        error: DiscussionErrorEnum.SERVER_ERROR,
      };
    }
  }

  async delete(discussionMessageId: number): Promise<Result<void>> {
    try {
      await this.databaseService.db
        .delete(discussionMessageTable)
        .where(eq(discussionMessageTable.id, discussionMessageId));
      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      this.logger.error(`Error deleting discussion message: ${error}`);
      return {
        success: false,
        error: DiscussionErrorEnum.SERVER_ERROR,
      };
    }
  }
}
