import {
  CreateDiscussionData,
  CreateDiscussionMessageResponse,
  DiscussionStatut,
  DiscussionStatutEnum,
  ReferentielEnum,
} from '@/backend/collectivites/discussions/domain/discussion.types';
import { DiscussionRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-repository.interface';
import { actionDefinitionTable } from '@/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, getTableColumns, like } from 'drizzle-orm';
import { DiscussionErrorEnum } from '../domain/discussion.errors';
import { Result } from './discussion.results';
import {
  CreateDiscussionMessageType,
  CreateDiscussionType,
  DiscussionMessage,
  discussionMessageTable,
  discussionTable,
  DiscussionType,
} from './discussion.tables';

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
        actionNom: actionDefinitionTable.nom,
        actionIdentifiant: actionDefinitionTable.identifiant,
      })
      .from(discussionTable)
      .leftJoin(
        actionDefinitionTable,
        eq(discussionTable.actionId, actionDefinitionTable.actionId)
      )
      .where(
        and(
          eq(discussionTable.collectiviteId, collectiviteId),
          like(discussionTable.actionId, `${referentielId}%`)
        )
      );
    return { success: true, data: discussions };
  }

  create: (
    discussion: CreateDiscussionData,
    tx?: Transaction
  ) => Promise<Result<DiscussionType>> = async (
    discussion,
    tx
  ): Promise<Result<DiscussionType>> => {
    try {
      const discussionToCreate: CreateDiscussionType = {
        collectiviteId: discussion.collectiviteId,
        actionId: discussion.actionId,
        status: DiscussionStatutEnum.OUVERT,
        createdBy: discussion.createdBy,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };
      const result = await (tx ?? this.databaseService.db)
        .insert(discussionTable)
        .values(discussionToCreate)
        .returning();
      if (!result || result.length === 0) {
        this.logger.error(
          `INSERT ne retourne pas de résultat pour la discussion ${discussion.actionId} de la collectivité ${discussion.collectiviteId}`,
          {
            operation: 'create_discussion',
            collectiviteId: discussion.collectiviteId,
            actionId: discussion.actionId,
            createdBy: discussion.createdBy,
            hasTransaction: !!tx,
            timestamp: new Date().toISOString(),
          }
        );
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

  async createDiscussionMessage(
    discussionMessage: CreateDiscussionMessageType,
    tx?: Transaction
  ): Promise<Result<CreateDiscussionMessageResponse>> {
    try {
      const result = await (tx ?? this.databaseService.db)
        .insert(discussionMessageTable)
        .values(discussionMessage)
        .returning();
      if (!result || result.length === 0) {
        this.logger.error(
          `INSERT ne retourne pas de résultat pour la discussion ${discussionMessage.discussionId}`,
          {
            operation: 'create_discussion_message',
            discussionId: discussionMessage.discussionId,
            createdBy: discussionMessage.createdBy,
            hasTransaction: !!tx,
            timestamp: new Date().toISOString(),
          }
        );
        return {
          success: true,
          data: result[0] || null,
        };
      }
      const [createdDiscussionMessage] = result;

      return {
        success: true,
        data: {
          ...createdDiscussionMessage,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du message de discussion: ${error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }

  async findById(id: number): Promise<Result<DiscussionType>> {
    try {
      const result = await this.databaseService.db
        .select()
        .from(discussionTable)
        .where(eq(discussionTable.id, id));

      if (!result || result.length === 0) {
        return {
          success: false,
          error: DiscussionErrorEnum.NOT_FOUND,
        };
      }
      const [discussion] = result;
      return {
        success: true,
        data: discussion,
      };
    } catch (error) {
      this.logger.error(`Error finding discussion by id ${id}: ${error}`);
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }

  async update(
    discussionId: number,
    status: DiscussionStatut
  ): Promise<Result<DiscussionType>> {
    try {
      const result = await this.databaseService.db
        .update(discussionTable)
        .set({
          status: status as DiscussionStatut,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(discussionTable.id, discussionId))
        .returning();

      if (!result || result.length === 0) {
        return {
          success: false,
          error: DiscussionErrorEnum.DATABASE_ERROR,
        };
      }

      const [discussion] = result;
      return { success: true, data: discussion };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de la discussion ${discussionId}: ${error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }

  async deleteDiscussionAndDiscussionMessage(
    discussionId: number,
    tx?: Transaction
  ): Promise<Result<void>> {
    try {
      console.log(
        `Suppression des messages de discussion pour la discussion ${discussionId}`
      );
      await (tx ?? this.databaseService.db)
        .delete(discussionMessageTable)
        .where(eq(discussionMessageTable.discussionId, discussionId));

      console.log(`Suppression de la discussion ${discussionId}`);
      await (tx ?? this.databaseService.db)
        .delete(discussionTable)
        .where(eq(discussionTable.id, discussionId));
      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression dela discussion et des messages de discussion: ${error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }
  async deleteDiscussionMessage(messageId: number): Promise<Result<void>> {
    try {
      await this.databaseService.db
        .delete(discussionMessageTable)
        .where(eq(discussionMessageTable.id, messageId));
      return { success: true, data: undefined };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression du message de discussion ${messageId}: ${error}`
      );
      return { success: false, error: DiscussionErrorEnum.DATABASE_ERROR };
    }
  }

  async updateDiscussionMessage(
    messageId: number,
    message: string
  ): Promise<Result<DiscussionMessage>> {
    try {
      const result = await this.databaseService.db
        .update(discussionMessageTable)
        .set({ message })
        .where(eq(discussionMessageTable.id, messageId))
        .returning();
      if (!result || result.length === 0) {
        return { success: false, error: DiscussionErrorEnum.DATABASE_ERROR };
      }
      const [updatedDiscussionMessage] = result;
      return {
        success: true,
        data: {
          ...updatedDiscussionMessage,
          createdByNom: null,
        },
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du message de discussion ${messageId}: ${error}`
      );
      return { success: false, error: DiscussionErrorEnum.DATABASE_ERROR };
    }
  }
}
