import { DatabaseService } from '@/backend/utils';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, getTableColumns, like } from 'drizzle-orm';
import { DiscussionRepository } from '../domain/discussion-repository.interface';
import {
  CreateDiscussionType,
  DiscussionErrorEnum,
  discussionTable,
  DiscussionType,
  ListDiscussionsRequestFilters,
  QueryOptionsType,
  ReferentielEnum,
  Result,
} from '../domain/discussion.type';

@Injectable()
export class DiscussionRepositoryImpl implements DiscussionRepository {
  private readonly logger = new Logger(DiscussionRepositoryImpl.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findByCollectiviteIdAndReferentielId(
    collectiviteId: number,
    referentielId: ReferentielEnum
  ): Promise<Result<DiscussionType[]>> {
    const discussions = await this.databaseService.db
      .select({
        ...getTableColumns(discussionTable),
      })
      .from(discussionTable)
      .where(
        and(
          eq(discussionTable.collectiviteId, collectiviteId),
          like(discussionTable.actionId, `${referentielId}%`)
        )
      );
    return { success: true, data: discussions };
  }

  list: (
    collectiviteId: number,
    referentielId: ReferentielEnum,
    filters?: ListDiscussionsRequestFilters,
    options?: QueryOptionsType
  ) => Promise<Result<DiscussionType[]>> = async (
    collectiviteId,
    referentielId
  ): Promise<Result<DiscussionType[]>> => {
    const discussions = await this.findByCollectiviteIdAndReferentielId(
      collectiviteId,
      referentielId
    );
    if (!discussions.success) {
      return discussions;
    }
    return { success: true, data: discussions.data };
  };
  create: (
    discussion: CreateDiscussionType,
    tx?: Transaction
  ) => Promise<Result<DiscussionType>> = async (
    discussion,
    tx
  ): Promise<Result<DiscussionType>> => {
    try {
      const result = await (tx ?? this.databaseService.db)
        .insert(discussionTable)
        .values(discussion)
        .returning();
      if (!result || result.length === 0) {
        return {
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        };
      }
      const [createdDiscussion] = result;
      this.logger.log(`Created discussion ${createdDiscussion.id}`);
      return {
        success: true,
        data: createdDiscussion,
      };
    } catch (error) {
      this.logger.error(`Error creating discussion: ${error}`);
      return {
        success: false,
        error: DiscussionErrorEnum.SERVER_ERROR,
      };
    }
  };

  async findById(id: number): Promise<DiscussionType | null> {
    const result = await this.databaseService.db
      .select()
      .from(discussionTable)
      .where(eq(discussionTable.id, id));
    if (!result || result.length === 0) {
      return null;
    }
    const [discussion] = result;
    return discussion;
  }
}
