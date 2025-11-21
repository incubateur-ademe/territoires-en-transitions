import { Injectable, Logger } from '@nestjs/common';

import { Result } from '../infrastructure/discussion.results';
import { DiscussionType } from '../infrastructure/discussion.tables';
import {
  DiscussionMessage,
  DiscussionMessages,
  DiscussionsMessagesListType,
  DiscussionWithActionName,
  ListDiscussionsRequestFilters,
} from '../presentation/discussion.schemas';
import { DiscussionQueryService } from './discussion-query-service';
import { DiscussionError, DiscussionErrorEnum } from './discussion.errors';
import { QueryOptionsType } from './discussion.query-options';
import { ReferentielEnum } from './discussion.types';

@Injectable()
export class ListDiscussionService {
  constructor(
    private readonly discussionQueryService: DiscussionQueryService,
    private readonly logger: Logger
  ) {}

  async listDiscussions(
    collectiviteId: number,
    referentielId: ReferentielEnum,
    filters?: ListDiscussionsRequestFilters,
    options?: QueryOptionsType
  ): Promise<Result<DiscussionsMessagesListType, DiscussionError>> {
    try {
      const discussionsResult =
        await this.discussionQueryService.listDiscussions(
          collectiviteId,
          referentielId,
          filters,
          options
        );

      if (!discussionsResult.success) {
        this.logger.error(
          'Erreur lors de la récupération des discussions depuis le repository'
        );
        return {
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        };
      }

      const discussions: DiscussionWithActionName[] =
        discussionsResult.data.discussions;

      // Fetch all messages for these discussions in a single query (avoiding N+1)
      const discussionIds: number[] = discussions.map(
        (d: DiscussionType) => d.id
      );
      const discussionMessages: Result<DiscussionMessage[], DiscussionError> =
        await this.discussionQueryService.findByDiscussionIds(discussionIds);

      if (!discussionMessages.success) {
        this.logger.error(
          'Erreur lors de la récupération des messages de discussion'
        );
        return {
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        };
      }

      // Group messages by discussionId for efficient lookup
      const messagesByDiscussionId = new Map<number, DiscussionMessage[]>();
      discussionMessages.data.forEach((message: DiscussionMessage) => {
        const existing: DiscussionMessage[] =
          messagesByDiscussionId.get(message.discussionId) || [];
        existing.push(message);
        messagesByDiscussionId.set(message.discussionId, existing);
      });

      const discussionsWithMessages: DiscussionMessages[] = discussions.map(
        (discussion: DiscussionWithActionName) => {
          return {
            ...discussion,
            messages: messagesByDiscussionId.get(discussion.id) || [],
          };
        }
      );
      return {
        success: true,
        data: {
          discussions: discussionsWithMessages,
          count: discussionsResult.data.count,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des discussions pour la collectivité ${collectiviteId} et le référentiel ${referentielId}: ${error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }
}
