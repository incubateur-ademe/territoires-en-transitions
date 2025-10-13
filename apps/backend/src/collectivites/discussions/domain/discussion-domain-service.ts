import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Inject, Injectable, Logger } from '@nestjs/common';

import type { DiscussionRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-repository.interface';
import { Result } from '../infrastructure/discussion.results';
import { DiscussionType } from '../infrastructure/discussion.tables';
import {
  CreateDiscussionData,
  CreateDiscussionMessageResponse,
  CreateDiscussionResponse,
  DiscussionMessage,
} from '../presentation/discussion.schemas';
import { DiscussionError, DiscussionErrorEnum } from './discussion.errors';
import { DiscussionStatus } from './discussion.types';

@Injectable()
export class DiscussionDomainService {
  constructor(
    @Inject('DiscussionRepository')
    private readonly discussionRepository: DiscussionRepository,
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
  async deleteDiscussionMessage(
    messageId: number,
    discussionId: number
  ): Promise<Result<void, DiscussionError>> {
    // Vérifier si le commentaire est le dernier commentaire de la discussion
    const countMessages =
      await this.discussionRepository.countMessagesDiscussionsByDiscussionId(
        discussionId
      );
    if (!countMessages.success) {
      this.logger.error(
        `Erreur lors de la recherche du nombre de messages de discussion: ${countMessages.error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
    // Si le nombre de messages est égal à 1, on supprime la discussion et le message de discussion
    if (countMessages.data === 1) {
      return await this.discussionRepository.deleteDiscussionAndDiscussionMessage(
        discussionId
      );
    }
    return await this.discussionRepository.deleteDiscussionMessage(messageId);
  }

  async updateDiscussion(
    discussionId: number,
    status: DiscussionStatus
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

  async updateDiscussionMessage(
    messageId: number,
    message: string
  ): Promise<Result<DiscussionMessage, DiscussionError>> {
    const result = await this.discussionRepository.updateDiscussionMessage(
      messageId,
      message
    );
    if (!result.success) {
      this.logger.error(
        `Erreur lors de la mise à jour du message de discussion: ${result.error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
    return result;
  }
}
