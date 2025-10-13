import {
  CreateDiscussionData,
  CreateDiscussionType,
  DiscussionErrorEnum,
  DiscussionStatut,
  DiscussionStatutEnum,
  discussionTable,
  DiscussionType,
  DiscussionWithActionName,
  ListDiscussionsRequestFilters,
  QueryOptionsType,
  ReferentielEnum,
  Result,
} from '@/backend/collectivites/discussions/domain/discussion.type';
import { DiscussionRepository } from '@/backend/collectivites/discussions/infrastructure/discussion-repository.interface';
import { actionDefinitionTable } from '@/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  desc,
  eq,
  getTableColumns,
  like,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';

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

  async list(
    collectiviteId: number,
    referentielId: ReferentielEnum,
    filters?: ListDiscussionsRequestFilters,
    options?: QueryOptionsType
  ): Promise<Result<DiscussionWithActionName[]>> {
    try {
      const conditions: (SQL | SQLWrapper | undefined)[] = [
        eq(discussionTable.collectiviteId, collectiviteId),
        like(discussionTable.actionId, `${referentielId}%`),
      ];

      // Apply filters
      if (filters?.status) {
        conditions.push(eq(discussionTable.status, filters.status));
      }

      if (filters?.actionId) {
        conditions.push(eq(discussionTable.actionId, filters.actionId));
      }

      const query = this.databaseService.db
        .select({
          ...getTableColumns(discussionTable),
          actionNom: sql<string>`${actionDefinitionTable.nom}`.as('actionNom'),
          actionIdentifiant:
            sql<string>`${actionDefinitionTable.identifiant}`.as(
              'actionIdentifiant'
            ),
        })
        .from(discussionTable)
        .leftJoin(
          actionDefinitionTable,
          eq(discussionTable.actionId, actionDefinitionTable.actionId)
        )
        .where(and(...conditions));

      // Apply sorting
      if (options?.sort) {
        options.sort.forEach((sort) => {
          const column =
            sort.field === 'actionId'
              ? actionDefinitionTable.actionId
              : sort.field === 'created_at'
              ? discussionTable.createdAt
              : discussionTable.status;

          query.orderBy(sort.direction === 'asc' ? column : desc(column));
        });
      }

      // Apply pagination
      if (options && 'limit' in options && options.limit !== 'all') {
        if ('page' in options) {
          query.limit(options.limit).offset((options.page - 1) * options.limit);
        }
      }

      const discussions = await query;

      return { success: true, data: discussions };
    } catch (error) {
      this.logger.error(
        `Error listing discussions for collectivite ${collectiviteId} and referentiel ${referentielId}: ${error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
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

  async findById(id: number): Promise<Result<DiscussionType>> {
    try {
      const result = await this.databaseService.db
        .select()
        .from(discussionTable)
        .where(eq(discussionTable.id, id))
        .limit(1);
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

  async findByCollectiviteAndAction(
    collectiviteId: number,
    actionId: string,
    tx?: Transaction
  ): Promise<Result<DiscussionType>> {
    try {
      const result = await (tx ?? this.databaseService.db)
        .select()
        .from(discussionTable)
        .where(
          and(
            eq(discussionTable.collectiviteId, collectiviteId),
            eq(discussionTable.actionId, actionId)
          )
        )
        .limit(1);

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
      this.logger.error(
        `Error finding discussion by collectiviteId ${collectiviteId} and actionId ${actionId}: ${error}`
      );
      return {
        success: false,
        error: DiscussionErrorEnum.DATABASE_ERROR,
      };
    }
  }

  async findOrCreate(
    discussion: CreateDiscussionData,
    tx?: Transaction
  ): Promise<Result<DiscussionType>> {
    try {
      // First, try to find existing discussion
      const existingDiscussion = await this.findByCollectiviteAndAction(
        discussion.collectiviteId,
        discussion.actionId,
        tx
      );

      if (existingDiscussion.success) {
        this.logger.log(
          `Found existing discussion ${existingDiscussion.data.id} for collectivite ${discussion.collectiviteId} and action ${discussion.actionId}`
        );
        return existingDiscussion;
      }

      // If not found, create it
      // The unique constraint will prevent duplicates if multiple requests arrive simultaneously
      const createResult = await this.create(discussion, tx);

      if (!createResult.success) {
        // If creation failed due to unique constraint violation, try to find again
        // This handles the race condition where another transaction created it between our find and create
        if (
          createResult.error === DiscussionErrorEnum.SERVER_ERROR ||
          createResult.error === DiscussionErrorEnum.DATABASE_ERROR
        ) {
          this.logger.warn(
            `Discussion creation failed, attempting to find existing discussion for collectivite ${discussion.collectiviteId} and action ${discussion.actionId}`
          );
          const retryFind = await this.findByCollectiviteAndAction(
            discussion.collectiviteId,
            discussion.actionId,
            tx
          );
          if (retryFind.success) {
            this.logger.log(
              `Found discussion ${retryFind.data.id} on retry after creation conflict`
            );
            return retryFind;
          }
        }
        return createResult;
      }

      return createResult;
    } catch (error) {
      this.logger.error(`Error in findOrCreate: ${error}`);
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
      this.logger.log(
        `La discussion ${discussionId} a été mise à jour avec le statut ${status}`
      );
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
}
