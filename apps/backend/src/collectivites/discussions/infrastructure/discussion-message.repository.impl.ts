import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { DiscussionMessageRepository } from '../domain/discussion-message-repository.interface';
import {
  CreateDiscussionMessageType,
  DiscussionError,
  discussionMessageTable,
  DiscussionMessageType,
  Result as GenericResult,
} from '../domain/discussion.type';

type Result<T> = GenericResult<T, DiscussionError>;

@Injectable()
export class DiscussionRepositoryImpl implements DiscussionMessageRepository {
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
          error: 'SERVER_ERROR',
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
        error: 'SERVER_ERROR',
      };
    }
  }
}

// const DiscussionAdapter = {
//   toDomain: (discussion: DiscussionType): CreateDiscussionRequest => {
//     return {
//       ...discussion,
//       discussionId: discussion.id,
//       createdBy: discussion.createdBy,
//       createdAt: discussion.createdAt,
//     };
//   },
// };
