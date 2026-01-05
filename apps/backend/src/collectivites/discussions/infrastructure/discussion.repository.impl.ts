import { Injectable, Logger } from '@nestjs/common';
import { DiscussionRepository } from '@tet/backend/collectivites/discussions/infrastructure/discussion-repository.interface';
import {
  CreateDiscussionData,
  CreateDiscussionMessageResponse,
} from '@tet/backend/collectivites/discussions/presentation/discussion.schemas';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  Discussion,
  DiscussionCreate,
  DiscussionMessage,
  DiscussionMessageCreate,
  DiscussionStatus,
  discussionStatus,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { and, count, eq, getTableColumns, like } from 'drizzle-orm';
import { DiscussionErrorEnum } from '../domain/discussion.errors';
import { DiscussionResult } from './discussion.results';
import { discussionMessageTable, discussionTable } from './discussion.table';

@Injectable()
export class DiscussionRepositoryImpl implements DiscussionRepository {
  private readonly logger = new Logger(DiscussionRepositoryImpl.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findByCollectiviteIdAndReferentielId(
    collectiviteId: number,
    referentielId: ReferentielId
  ): Promise<DiscussionResult<Discussion[]>> {
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
  ) => Promise<DiscussionResult<Discussion>> = async (
    discussion,
    tx
  ): Promise<DiscussionResult<Discussion>> => {
    try {
      const discussionToCreate: DiscussionCreate = {
        collectiviteId: discussion.collectiviteId,
        actionId: discussion.actionId,
        status: discussionStatus.OUVERT,
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
    discussionMessage: DiscussionMessageCreate,
    tx?: Transaction
  ): Promise<DiscussionResult<CreateDiscussionMessageResponse>> {
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

  async findById(id: number): Promise<DiscussionResult<Discussion>> {
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

  async countMessagesDiscussionsByDiscussionId(
    discussionId: number
  ): Promise<DiscussionResult<number>> {
    try {
      const result = await this.databaseService.db
        .select({ count: count() })
        .from(discussionMessageTable)
        .where(eq(discussionMessageTable.discussionId, discussionId));
      return { success: true, data: result[0]?.count ?? 0 };
    } catch (error) {
      this.logger.error(
        `Erreur lors de la recherche des messages de discussion par discussionId ${discussionId}: ${error}`
      );
      return { success: false, error: DiscussionErrorEnum.DATABASE_ERROR };
    }
  }

  async update(
    discussionId: number,
    status: DiscussionStatus
  ): Promise<DiscussionResult<Discussion>> {
    try {
      const result = await this.databaseService.db
        .update(discussionTable)
        .set({
          status: status as DiscussionStatus,
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
  ): Promise<DiscussionResult<void>> {
    try {
      console.log(
        `Suppression des messages de discussion pour la discussion ${discussionId}`
      );
      await (tx ?? this.databaseService.db)
        .delete(discussionMessageTable)
        .where(eq(discussionMessageTable.discussionId, discussionId));
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
  async deleteDiscussionMessage(
    messageId: number
  ): Promise<DiscussionResult<void>> {
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
  ): Promise<DiscussionResult<DiscussionMessage>> {
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
          createdByPrenom: null,
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
