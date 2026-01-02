import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { AxeLight, FlatAxe, flatAxeSchema, PlanNode } from '@tet/domain/plans';
import { and, asc, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import z from 'zod';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { ListAxesError, ListAxesErrorEnum } from './list-axes.errors';
import { ListAxesInput } from './list-axes.input';

export type ListAxesOutput = {
  axes: AxeLight[];
  totalCount: number;
};

@Injectable()
export class ListAxesRepository {
  private readonly logger = new Logger(ListAxesRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /** Liste les sous-axes directs d'un axe (ou d'un plan)  */
  async listChildren(
    input: ListAxesInput,
    tx?: Transaction
  ): Promise<Result<ListAxesOutput, ListAxesError>> {
    const { collectiviteId, parentId, limit, page, sort } = input;

    try {
      const result = await (tx || this.databaseService.db)
        .select({
          ...getTableColumns(axeTable),
          totalCount: sql<number>`(count(*) over())::int`,
        })
        .from(axeTable)
        .where(
          and(
            eq(axeTable.collectiviteId, collectiviteId),
            eq(axeTable.parent, parentId)
          )
        )
        .orderBy(this.getSortOrderBy(sort))
        .limit(limit || 1000)
        .offset(page && limit ? (page - 1) * limit : 0);

      const totalCount = result.length > 0 ? result[0].totalCount : 0;
      const axes = result.map(({ totalCount, ...axe }) => axe);

      return {
        success: true,
        data: {
          axes,
          totalCount,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error listing axes for parent ${parentId} and collectivité ${collectiviteId}: ${error}`
      );
      return {
        success: false,
        error: ListAxesErrorEnum.LIST_AXES_ERROR,
      };
    }
  }

  /** Liste récursivement tous les sous-axes d'un axe (ou d'un plan) */
  async listChildrenRecursively(
    input: ListAxesInput,
    tx?: Transaction
  ): Promise<Result<PlanNode[], ListAxesError>> {
    try {
      const { parentId, collectiviteId } = input;
      const result = await (tx || this.databaseService.db).execute(sql`
      WITH RECURSIVE
        parents AS (
          SELECT id,
                 COALESCE(nom, '') AS nom,
                 description,
                 0 AS depth,
                 ARRAY[]::integer[] AS ancestors,
                 '0 ' || COALESCE(nom, '') AS sort_path
          FROM axe
          WHERE id = ${parentId} and collectivite_id = ${collectiviteId}

          UNION ALL

          SELECT a.id,
                 a.nom,
                 a.description,
                 depth + 1,
                 ancestors || a.parent,
                 parents.sort_path || ' ' || depth + 1 || ' ' || COALESCE(a.nom, '')
          FROM parents
          JOIN axe a ON a.parent = parents.id
          WHERE a.collectivite_id = ${collectiviteId}
        ),
        fiches AS (
          SELECT a.id,
                  array_agg(faa.fiche_id) AS fiches
          FROM parents a
          JOIN fiche_action_axe faa ON a.id = faa.axe_id
          GROUP BY a.id
        )
      SELECT id, nom, description, fiches, ancestors, depth, sort_path
      FROM parents
      LEFT JOIN fiches USING (id)
      ORDER BY naturalsort(sort_path);
    `);

      return this.sanitizeAxes(
        result.rows.map((row) => ({ ...row, fiches: row.fiches || [] }))
      );
    } catch (error) {
      this.logger.error(
        `Error executing plan query for plan ${input?.parentId}: ${error}`
      );
      return {
        success: false,
        error: ListAxesErrorEnum.SERVER_ERROR,
      };
    }
  }

  private getSortOrderBy = (sort?: {
    field: 'nom' | 'createdAt';
    direction: 'asc' | 'desc';
  }) => {
    // default or explicit 'nom' → natural sort
    if (!sort || sort.field === 'nom') {
      return sort?.direction === 'desc'
        ? sql`naturalsort(${axeTable.nom}) desc`
        : sql`naturalsort(${axeTable.nom}) asc`;
    }

    // other fields keep standard ordering
    const { direction } = sort;
    const sortMethod = direction === 'asc' ? asc : desc;
    const columnToSort = axeTable.createdAt;
    return sortMethod(columnToSort);
  };

  private flatAxesToNodes(axes: FlatAxe[]): PlanNode[] {
    return axes.map(({ ancestors, nom, sort_path, ...a }) => {
      return {
        ...a,
        parent: ancestors?.length ? ancestors[ancestors.length - 1] : null,
        nom: nom ?? 'Sans titre',
      };
    });
  }

  private sanitizeAxes(
    unsafeAxes: Record<string, unknown>[]
  ): Result<PlanNode[], ListAxesError> {
    const sanitizedResult = z.array(flatAxeSchema).safeParse(unsafeAxes);
    if (!sanitizedResult.success) {
      this.logger.log(`sanitizeAxes error: ${sanitizedResult.error.message}`);
      return {
        success: false,
        error: ListAxesErrorEnum.LIST_AXES_ERROR,
      };
    }
    return {
      success: true,
      data: this.flatAxesToNodes(sanitizedResult.data),
    };
  }
}
