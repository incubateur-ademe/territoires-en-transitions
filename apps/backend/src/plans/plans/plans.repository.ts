import {
  AxeLight,
  CreatePlanRequest,
  flatAxeSchema,
  PlanNode,
  PlanReferentOrPilote,
  PlanType,
  UpdatePlanRequest as UpdatePlanOrAxeRequest,
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
} from '@/domain/plans';
import { Injectable, Logger } from '@nestjs/common';
import { and, asc, desc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { DatabaseService } from '../../utils/database/database.service';

import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { planActionTypeTable } from '@/backend/plans/fiches/shared/models/plan-action-type.table';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { dcpTable as userTable } from '@/backend/users/models/dcp.table';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { PermissionOperationEnum } from '@/domain/users';
import { axeTable } from '../fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '../fiches/shared/models/fiche-action-axe.table';
import { planPiloteTable } from '../fiches/shared/models/plan-pilote.table';
import { planReferentTable } from '../fiches/shared/models/plan-referent.table';
import { PlanError } from './plans.errors';
import { PlansRepositoryInterface } from './plans.repository.interface';
import { Result as GenericResult } from './plans.result';
import { flatAxesToPlanNodes } from './utils';

type Result<T> = GenericResult<T, PlanError>;

@Injectable()
export class PlansRepository implements PlansRepositoryInterface {
  private readonly logger = new Logger(PlansRepository.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly collectivite: CollectivitesService
  ) {}

  async create(
    plan: CreatePlanRequest,
    userId: string,
    tx?: Transaction
  ): Promise<Result<AxeLight>> {
    try {
      const result = await (tx ?? this.databaseService.db)
        .insert(axeTable)
        .values({
          ...plan,
          modifiedBy: userId,
          modifiedAt: new Date().toISOString(),
        })
        .returning();

      if (!result || result.length === 0) {
        return {
          success: false,
          error: 'SERVER_ERROR',
        };
      }

      const [createdAxe] = result;
      this.logger.log(`Created plan ${createdAxe.id}`);
      return {
        success: true,
        data: createdAxe,
      };
    } catch (error) {
      this.logger.error(`Error creating plan: ${error}`);
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  async update(
    planOrAxeId: number,
    planOrAxe: UpdatePlanOrAxeRequest,
    userId: string,
    tx?: Transaction
  ): Promise<Result<AxeLight>> {
    try {
      const result = await (tx ?? this.databaseService.db)
        .update(axeTable)
        .set({
          ...planOrAxe,
          modifiedBy: userId,
          modifiedAt: new Date().toISOString(),
        })
        .where(eq(axeTable.id, planOrAxeId))
        .returning();

      if (!result || result.length === 0) {
        return {
          success: false,
          error: 'SERVER_ERROR',
        };
      }

      const [updatedAxe] = result;
      if (planOrAxeId !== planOrAxe.id) {
        this.logger.log(`Updated axe ${planOrAxeId}`);
      } else {
        this.logger.log(`Updated plan ${planOrAxeId}`);
      }

      return {
        success: true,
        data: updatedAxe,
      };
    } catch (error) {
      this.logger.error(`Error updating plan/axe ${planOrAxeId}: ${error}`);
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  async findById(
    planId: number
  ): Promise<Result<AxeLight & { pilotes: PlanReferentOrPilote[] }>> {
    try {
      const [plan] = await this.databaseService.db
        .select()
        .from(axeTable)
        .where(eq(axeTable.id, planId))
        .limit(1);

      if (!plan) {
        return {
          success: false,
          error: 'PLAN_NOT_FOUND',
        };
      }

      const pilotesResult = await this.getPilotes(planId);
      if (!pilotesResult.success) {
        return {
          success: false,
          error: pilotesResult.error,
        };
      }

      return {
        success: true,
        data: {
          ...plan,
          pilotes: pilotesResult.data,
        },
      };
    } catch (error) {
      this.logger.error(`Error finding plan by id ${planId}: ${error}`);
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

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

  async list(
    collectiviteId: number,
    options?: {
      limit?: number;
      page?: number;
      sort?: {
        field: 'nom' | 'createdAt' | 'type';
        direction: 'asc' | 'desc';
      };
    }
  ): Promise<Result<{ plans: AxeLight[]; totalCount: number }>> {
    try {
      const { limit, page, sort } = options || {};

      const result = await this.databaseService.db
        .select({
          ...getTableColumns(axeTable),
          totalCount: sql<number>`count(*) over()`,
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
        `Error listing plans for collectivité ${collectiviteId}: ${error}`
      );
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  async getReferents(planId: number): Promise<Result<PlanReferentOrPilote[]>> {
    try {
      const referents = await this.databaseService.db
        .select({
          tagId: planReferentTable.tagId,
          userId: planReferentTable.userId,
          userName: sql<
            string | null
          >`CASE WHEN ${userTable.prenom} IS NULL AND ${userTable.nom} IS NULL THEN NULL ELSE TRIM(CONCAT(COALESCE(${userTable.prenom}, ''), ' ', COALESCE(${userTable.nom}, ''))) END`,
          tagName: personneTagTable.nom,
        })
        .from(planReferentTable)
        .leftJoin(userTable, eq(planReferentTable.userId, userTable.userId))
        .leftJoin(
          personneTagTable,
          eq(planReferentTable.tagId, personneTagTable.id)
        )
        .where(eq(planReferentTable.planId, planId));

      return {
        success: true,
        data: referents,
      };
    } catch (error) {
      this.logger.error(`Error getting referents for plan ${planId}: ${error}`);
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  async setReferents(
    planId: number,
    referents: UpdatePlanReferentsSchema[],
    userId: string,
    tx?: Transaction
  ): Promise<Result<UpdatePlanReferentsSchema[]>> {
    try {
      await (tx ?? this.databaseService.db)
        .delete(planReferentTable)
        .where(eq(planReferentTable.planId, planId));

      if (referents.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      const response = await (tx ?? this.databaseService.db)
        .insert(planReferentTable)
        .values(
          referents.map((referent) => ({
            ...referent,
            planId,
            createdBy: userId,
            createdAt: new Date().toISOString(),
          }))
        )
        .returning();

      this.logger.log(`Set ${referents.length} referents for plan ${planId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      this.logger.error(`Error setting referents for plan ${planId}: ${error}`);
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  async getPilotes(planId: number): Promise<Result<PlanReferentOrPilote[]>> {
    try {
      const pilotes = await this.databaseService.db
        .select({
          tagId: planPiloteTable.tagId,
          userId: planPiloteTable.userId,
          userName: sql<
            string | null
          >`CASE WHEN ${userTable.prenom} IS NULL AND ${userTable.nom} IS NULL THEN NULL ELSE TRIM(CONCAT(COALESCE(${userTable.prenom}, ''), ' ', COALESCE(${userTable.nom}, ''))) END`,
          tagName: personneTagTable.nom,
        })
        .from(planPiloteTable)
        .leftJoin(userTable, eq(planPiloteTable.userId, userTable.userId))
        .leftJoin(
          personneTagTable,
          eq(planPiloteTable.tagId, personneTagTable.id)
        )
        .where(eq(planPiloteTable.planId, planId));

      return {
        success: true,
        data: pilotes,
      };
    } catch (error) {
      this.logger.error(`Error getting pilotes for plan ${planId}: ${error}`);
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  async setPilotes(
    planId: number,
    pilotes: UpdatePlanPilotesSchema[],
    userId: string,
    tx?: Transaction
  ): Promise<Result<UpdatePlanPilotesSchema[]>> {
    try {
      await (tx ?? this.databaseService.db)
        .delete(planPiloteTable)
        .where(eq(planPiloteTable.planId, planId));

      if (pilotes.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      const response = await (tx ?? this.databaseService.db)
        .insert(planPiloteTable)
        .values(
          pilotes.map((pilote) => ({
            ...pilote,
            planId,
            createdBy: userId,
            createdAt: new Date().toISOString(),
          }))
        )
        .returning();

      this.logger.log(`Set ${pilotes.length} pilotes for plan ${planId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      this.logger.error(`Error setting pilotes for plan ${planId}: ${error}`);
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  async getPlan({
    planId,
    user,
  }: {
    planId: number;
    user: AuthenticatedUser;
  }): Promise<Result<PlanNode[]>> {
    const plan = await this.getPlanBasicInfo(planId);
    if (!plan.success) {
      return {
        success: false,
        error: plan.error,
      };
    }

    const collectiviteId = plan.data.collectiviteId;

    const collectivitePrivate = await this.collectivite.isPrivate(
      collectiviteId
    );

    const isAllowed = await this.permissionService.isAllowed(
      user,
      collectivitePrivate
        ? PermissionOperationEnum['PLANS.READ']
        : PermissionOperationEnum['PLANS.READ_PUBLIC'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );

    if (!isAllowed) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
      };
    }

    try {
      const result = await this.databaseService.db.execute(sql`
        WITH RECURSIVE
          parents AS (
            SELECT id,
                   COALESCE(nom, '') AS nom,
                   collectivite_id,
                   0 AS depth,
                   ARRAY[]::integer[] AS ancestors,
                   '0 ' || COALESCE(nom, '') AS sort_path
            FROM axe
            WHERE id = ${planId}

            UNION ALL

            SELECT a.id,
                   a.nom,
                   a.collectivite_id,
                   depth + 1,
                   ancestors || a.parent,
                   parents.sort_path || ' ' || depth + 1 || ' ' || COALESCE(a.nom, '')
            FROM parents
            JOIN axe a ON a.parent = parents.id
          ),
          fiches AS (
            SELECT a.id,
                   array_agg(faa.fiche_id) AS fiches
            FROM parents a
            JOIN fiche_action_axe faa ON a.id = faa.axe_id
            GROUP BY a.id
          )
        SELECT id, nom, fiches, ancestors, depth, sort_path
        FROM parents
        LEFT JOIN fiches USING (id)
        ORDER BY naturalsort(sort_path);
      `);

      const sanitizedResult = z.array(flatAxeSchema).safeParse(
        result.rows.map((row) => ({
          ...row,
          fiches: row.fiches ?? [],
          collectiviteId,
        }))
      );
      if (!sanitizedResult.success) {
        return {
          success: false,
          error: 'SERVER_ERROR',
        };
      }
      return {
        success: true,
        data: flatAxesToPlanNodes(sanitizedResult.data),
      };
    } catch (error) {
      this.logger.error(
        `Error executing plan query for plan ${planId}: ${error}`
      );
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  async getPlanBasicInfo(
    planId: number
  ): Promise<Result<AxeLight & { type: PlanType | null }>> {
    try {
      const result = await this.databaseService.db
        .select({
          id: axeTable.id,
          nom: axeTable.nom,
          collectiviteId: axeTable.collectiviteId,
          parent: axeTable.parent,
          plan: axeTable.plan,
          typeId: axeTable.typeId,
          createdAt: axeTable.createdAt,
          modifiedAt: axeTable.modifiedAt,
          modifiedBy: axeTable.modifiedBy,
          panierId: axeTable.panierId,
          type: planActionTypeTable,
        })
        .from(axeTable)
        .where(eq(axeTable.id, planId))
        .leftJoin(
          planActionTypeTable,
          eq(axeTable.typeId, planActionTypeTable.id)
        )
        .limit(1);

      if (!result || result.length === 0) {
        return {
          success: false,
          error: 'PLAN_NOT_FOUND',
        };
      }

      const [plan] = result;
      return {
        success: true,
        data: plan,
      };
    } catch (error) {
      this.logger.error(
        `Error getting plan basic info for plan ${planId}: ${error}`
      );
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  async deleteAxeAndChildrenAxes(
    axeId: number
  ): Promise<Result<{ impactedFicheIds: number[] }>> {
    const childAxesResult = await this.getChildAxesRecursively(axeId);
    if (!childAxesResult.success) {
      return childAxesResult;
    }

    const childAxes = childAxesResult.data;
    const impactedFicheIds: number[] = [];

    // Delete all child axes first (in reverse order to avoid foreign key constraints)
    for (const childId of childAxes.reverse()) {
      const deleteResult = await this.deleteAxeDataOnly(childId);
      if (!deleteResult.success) {
        return deleteResult;
      }
      impactedFicheIds.push(...deleteResult.data.impactedFicheIds);
    }

    const mainDeleteResult = await this.deleteAxeDataOnly(axeId);
    if (!mainDeleteResult.success) {
      return mainDeleteResult;
    }
    impactedFicheIds.push(...mainDeleteResult.data.impactedFicheIds);

    this.logger.log(`Deleted axe ${axeId} and ${childAxes.length} child axes`);
    return {
      success: true,
      data: { impactedFicheIds },
    };
  }

  private async getChildAxesRecursively(
    axeId: number
  ): Promise<Result<number[]>> {
    try {
      const children = await this.databaseService.db
        .select({ id: axeTable.id })
        .from(axeTable)
        .where(eq(axeTable.parent, axeId));

      const allChildren: number[] = [];
      for (const child of children) {
        allChildren.push(child.id);
        const grandChildrenResult = await this.getChildAxesRecursively(
          child.id
        );
        if (!grandChildrenResult.success) {
          return grandChildrenResult;
        }
        allChildren.push(...grandChildrenResult.data);
      }

      return {
        success: true,
        data: allChildren,
      };
    } catch (error) {
      this.logger.error(`Error getting child axes for axe ${axeId}: ${error}`);
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }

  private async deleteAxeDataOnly(
    axeId: number
  ): Promise<Result<{ impactedFicheIds: number[] }>> {
    try {
      const associatedFiches = await this.databaseService.db
        .select({ ficheId: ficheActionAxeTable.ficheId })
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.axeId, axeId));

      const impactedFicheIds: number[] = [];

      for (const { ficheId } of associatedFiches) {
        if (ficheId === null) continue;

        await this.databaseService.db
          .delete(ficheActionAxeTable)
          .where(
            eq(ficheActionAxeTable.ficheId, ficheId) &&
              eq(ficheActionAxeTable.axeId, axeId)
          );

        const remainingAssociations = await this.databaseService.db
          .select()
          .from(ficheActionAxeTable)
          .where(eq(ficheActionAxeTable.ficheId, ficheId));

        const isFicheOrphan = remainingAssociations.length === 0;
        if (isFicheOrphan) {
          impactedFicheIds.push(ficheId);
        }
      }

      // Delete plan referents
      await this.databaseService.db
        .delete(planReferentTable)
        .where(eq(planReferentTable.planId, axeId));

      // Delete plan pilotes
      await this.databaseService.db
        .delete(planPiloteTable)
        .where(eq(planPiloteTable.planId, axeId));

      // Delete the axe itself
      await this.databaseService.db
        .delete(axeTable)
        .where(eq(axeTable.id, axeId));

      return {
        success: true,
        data: { impactedFicheIds },
      };
    } catch (error) {
      this.logger.error(`Error deleting axe data for axe ${axeId}: ${error}`);
      return {
        success: false,
        error: 'SERVER_ERROR',
      };
    }
  }
}
