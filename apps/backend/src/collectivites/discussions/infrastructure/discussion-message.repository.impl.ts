import {
  CreateDiscussionMessageType,
  DiscussionError,
  DiscussionErrorEnum,
  DiscussionMessage,
  discussionMessageTable,
  Result as GenericResult,
} from '@/backend/collectivites/discussions/domain/discussion.type';
import { DiscussionMessageRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-message-repository.interface';
import { dcpTable as userTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { eq, getTableColumns, inArray, sql } from 'drizzle-orm';

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
  ): Promise<Result<DiscussionMessage>> {
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
      // Fetch the createdByNom field for the new message to match the structure of DiscussionMessage
      const createdByNomResult = await (tx ?? this.databaseService.db)
        .select({
          createdByNom: sql<string | null>`
            CASE
              WHEN ${userTable.prenom} IS NULL AND ${userTable.nom} IS NULL
                THEN NULL
              ELSE TRIM(CONCAT(COALESCE(${userTable.prenom}, ''), ' ', COALESCE(${userTable.nom}, '')))
            END
          `,
        })
        .from(userTable)
        .where(eq(userTable.userId, createdDiscussionMessage.createdBy!))
        .limit(1);

      const createdByNom =
        createdByNomResult && createdByNomResult[0]
          ? createdByNomResult[0].createdByNom
          : null;

      return {
        success: true,
        data: {
          ...createdDiscussionMessage,
          createdByNom,
        },
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
  ): Promise<Result<DiscussionMessage[]>> {
    try {
      const discussionMessages = await this.databaseService.db
        .select({
          ...getTableColumns(discussionMessageTable),
          createdByNom: sql<
            string | null
          >`CASE WHEN ${userTable.prenom} IS NULL AND ${userTable.nom} IS NULL THEN NULL ELSE TRIM(CONCAT(COALESCE(${userTable.prenom}, ''), ' ', COALESCE(${userTable.nom}, ''))) END`,
        })
        .from(discussionMessageTable)
        .leftJoin(
          userTable,
          eq(discussionMessageTable.createdBy, userTable.userId)
        )
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
