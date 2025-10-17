import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DiscussionRepository } from '../domain/discussion-repository.interface';
import {
  CreateDiscussionType,
  DiscussionErrorEnum,
  discussionTable,
  DiscussionType,
  Result,
} from '../domain/discussion.type';

@Injectable()
export class DiscussionRepositoryImpl implements DiscussionRepository {
  private readonly logger = new Logger(DiscussionRepositoryImpl.name);
  constructor(private readonly databaseService: DatabaseService) {}
  // delete: (id: number) => void = () => {
  //   return this.databaseService.db.delete(discussionTable).where(eq(discussionTable.id, id));
  // };
  // list: (collectiviteId: number, filters: DiscussionFilters) => DiscussionType[] = () => {
  //   return this.databaseService.list(collectiviteId, filters);
  // };
  // findById: (id: number) => DiscussionType | null = () => {
  //   return this.databaseService.findById(id);
  // };
  // findByActionId: (actionId: string) => DiscussionType | null = () => {
  //   return this.databaseService.findByActionId(actionId);
  // };
  // findByCollectiviteId: (collectiviteId: number) => DiscussionType | null = () => {
  //   return this.databaseService.findByCollectiviteId(collectiviteId);
  // };
  // findByCollectiviteIdAndActionId: (collectiviteId: number, actionId: string) => DiscussionType | null = () => {
  //   return this.databaseService.findByCollectiviteIdAndActionId(collectiviteId, actionId);
  // };

  async create(
    discussion: CreateDiscussionType
  ): Promise<Result<DiscussionType>> {
    try {
      const result = await this.databaseService.db
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
      this.logger.error(`Error upserting discussion: ${error}`);
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }

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
