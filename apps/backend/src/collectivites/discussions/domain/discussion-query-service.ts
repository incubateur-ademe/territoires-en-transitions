import { Injectable, Logger } from '@nestjs/common';

import { actionDefinitionTable } from '@/backend/referentiels/models/action-definition.table';
import { dcpTable as userTable } from '@/backend/users/models/dcp.table';
import { DatabaseService } from '@/backend/utils/database/database.service';
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  like,
  SQL,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
import { Result } from '../infrastructure/discussion.results';
import {
  discussionMessageTable,
  discussionTable,
} from '../infrastructure/discussion.tables';
import {
  DiscussionMessage,
  DiscussionsListType,
  ListDiscussionsRequestFilters,
} from '../presentation/discussion.schemas';
import { DiscussionErrorEnum } from './discussion.errors';
import { QueryOptionsType } from './discussion.query-options';
import { ReferentielEnum } from './discussion.types';

@Injectable()
export class DiscussionQueryService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: Logger
  ) {}

  async findByDiscussionIds(
    discussionIds: number[]
  ): Promise<Result<DiscussionMessage[]>> {
    try {
      const discussionMessages = await this.databaseService.db
        .select({
          ...getTableColumns(discussionMessageTable),
          createdByNom: sql<
            string | null
          >`CASE WHEN ${userTable.prenom} IS NULL AND ${userTable.nom} IS NULL THEN NULL ELSE TRIM(COALESCE(${userTable.nom}, '')) END`,
          createdByPrenom: sql<
            string | null
          >`CASE WHEN ${userTable.prenom} IS NULL AND ${userTable.nom} IS NULL THEN NULL ELSE TRIM(COALESCE(${userTable.prenom}, '')) END`,
        })
        .from(discussionMessageTable)
        .leftJoin(
          userTable,
          eq(discussionMessageTable.createdBy, userTable.userId)
        )
        .orderBy(asc(discussionMessageTable.createdAt))
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

  async listDiscussions(
    collectiviteId: number,
    referentielId: ReferentielEnum,
    filters?: ListDiscussionsRequestFilters,
    options?: QueryOptionsType
  ): Promise<Result<DiscussionsListType>> {
    const conditions: (SQL | SQLWrapper | undefined)[] = [
      eq(discussionTable.collectiviteId, collectiviteId),
      like(discussionTable.actionId, `${referentielId}%`),
    ];

    // Apply filters
    if (filters?.status) {
      conditions.push(eq(discussionTable.status, filters.status));
    }

    if (filters?.actionId) {
      // In order to find all sub actions, we need to use a like query with a wildcard
      conditions.push(like(discussionTable.actionId, `${filters.actionId}%`));
    }

    const query = this.databaseService.db
      .select({
        ...getTableColumns(discussionTable),
        actionNom: sql<string>`${actionDefinitionTable.nom}`.as('actionNom'),
        actionIdentifiant: sql<string>`${actionDefinitionTable.identifiant}`.as(
          'actionIdentifiant'
        ),
      })
      .from(discussionTable)
      .leftJoin(
        actionDefinitionTable,
        eq(discussionTable.actionId, actionDefinitionTable.actionId)
      )
      .where(and(...conditions));

    const discussionCountQuery = this.databaseService.db
      .select({
        count: sql<number>`(count(*) over())::int`,
      })
      .from(discussionTable)
      .leftJoin(
        actionDefinitionTable,
        eq(discussionTable.actionId, actionDefinitionTable.actionId)
      )
      .where(and(...conditions));

    const [discussionCount] = await discussionCountQuery;

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

    return {
      success: true,
      data: { discussions, count: discussionCount?.count ?? 0 },
    };
  }
}
