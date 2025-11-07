import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Inject, Injectable, Logger } from '@nestjs/common';

import type { DiscussionRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-repository.interface';
import { Result } from '../infrastructure/discussion.results';
import { DiscussionType } from '../infrastructure/discussion.tables';
import { DiscussionQueryService } from './discussion-query-service';
import { DiscussionError, DiscussionErrorEnum } from './discussion.errors';
import {
  CreateDiscussionData,
  CreateDiscussionMessageResponse,
  CreateDiscussionResponse,
  DiscussionStatut,
} from './discussion.types';

@Injectable()
export class DiscussionDomainService {
  constructor(
    @Inject('DiscussionRepository')
    private readonly discussionRepository: DiscussionRepository,
    private readonly discussionQueryService: DiscussionQueryService,
    private readonly logger: Logger
  ) {}

  async createOrUpdateDiscussion(
    discussionData: CreateDiscussionData,
    tx?: Transaction
  ): Promise<Result<CreateDiscussionResponse, DiscussionError>> {
    let discussion: Result<DiscussionType, DiscussionError>;

    if (!discussionData.discussionId) {
      discussion = await this.discussionRepository.create(discussionData);
      if (!discussion.success) {
        this.logger.error(
          `Erreur lors de la création de la discussion: ${discussion.error}`
        );
        return {
          success: false,
          error: discussion.error,
        };
      }
    } else {
      discussion = await this.discussionRepository.findById(
        discussionData.discussionId
      );
      if (!discussion.success) {
        this.logger.error(
          `Erreur lors de la recherche de la discussion: ${discussion.error}`
        );
        return {
          success: false,
          error: discussion.error,
        };
      }
    }
    const discussionMessage: Result<
      CreateDiscussionMessageResponse,
      DiscussionError
    > = await this.discussionRepository.createDiscussionMessage(
      {
        discussionId: discussion?.data?.id ?? discussionData.discussionId,
        message: discussionData.message,
        createdBy: discussionData.createdBy,
        createdAt: new Date().toISOString(),
      },
      tx
    );

    if (!discussionMessage.success) {
      this.logger.error(
        `Erreur lors de la création du message de discussion: ${discussionMessage.error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }

    return {
      success: true,
      data: {
        id: discussionMessage.data.discussionId,
        messageId: discussionMessage.data.id,
        collectiviteId: discussionData.collectiviteId,
        actionId: discussionData.actionId,
        status: discussion.data.status,
        createdBy: discussionMessage.data.createdBy,
        createdAt: discussionMessage.data.createdAt,
        message: discussionMessage.data.message,
      },
    };
  }

  async deleteDiscussionAndDiscussionMessage(
    discussionId: number
  ): Promise<Result<void, DiscussionError>> {
    return await this.discussionRepository.deleteDiscussionAndDiscussionMessage(
      discussionId
    );
  }

  async updateDiscussion(
    discussionId: number,
    status: DiscussionStatut
  ): Promise<Result<DiscussionType, DiscussionError>> {
    const result = await this.discussionRepository.update(discussionId, status);
    if (!result.success) {
      this.logger.error(
        `Erreur lors de la mise à jour de la discussion: ${result.error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
    return result;
  }
}
