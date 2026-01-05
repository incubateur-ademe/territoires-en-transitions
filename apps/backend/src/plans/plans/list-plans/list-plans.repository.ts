import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { AxeLight } from '@tet/domain/plans';
import { and, asc, desc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { ListPlansError, ListPlansErrorEnum } from './list-plans.errors';
import { ListPlansInput } from './list-plans.input';

export type ListPlansRepositoryOutput = {
  plans: AxeLight[];
  totalCount: number;
};

@Injectable()
export class ListPlansRepository {
  private readonly logger = new Logger(ListPlansRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private getSortOrderBy = (sort?: {
    field: 'nom' | 'createdAt' | 'type';
    direction: 'asc' | 'desc';
  }) => {
    // default or explicit 'nom' → natural sort
    if (!sort || sort.field === 'nom') {
      return sort?.direction === 'desc'
        ? sql`naturalsort(${axeTable.nom}) desc`
        : sql`naturalsort(${axeTable.nom}) asc`;
    }

    // other fields keep standard ordering
    const { field, direction } = sort;
    const sortMethod = direction === 'asc' ? asc : desc;
    const columnToSort =
      field === 'createdAt' ? axeTable.createdAt : axeTable.typeId;
    return sortMethod(columnToSort);
  };

  async listPlans(
    input: ListPlansInput,
    tx?: Transaction
  ): Promise<Result<ListPlansRepositoryOutput, ListPlansError>> {
    try {
      const { collectiviteId, limit, page, sort } = input;

      const db = tx || this.databaseService.db;

      const result = await db
        .select({
          ...getTableColumns(axeTable),
          totalCount: sql<number>`(count(*) over())::int`,
        })
        .from(axeTable)
        .where(
          and(
            eq(axeTable.collectiviteId, collectiviteId),
            isNull(axeTable.parent)
          )
        )
        .orderBy(this.getSortOrderBy(sort))
        .limit(limit || 1000)
        .offset(page && limit ? (page - 1) * limit : 0);

      const totalCount = result.length > 0 ? result[0].totalCount : 0;
      const plans = result.map(({ totalCount, ...plan }) => plan);

      return {
        success: true,
        data: {
          plans,
          totalCount,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error listing plans for collectivité ${input.collectiviteId}: ${error}`
      );
      return {
        success: false,
        error: ListPlansErrorEnum.LIST_PLANS_ERROR,
      };
    }
  }
}
