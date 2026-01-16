import { Injectable, Logger } from '@nestjs/common';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { dcpTable as userTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { Personne } from '@tet/domain/collectivites';
import { AxeLight, PlanType } from '@tet/domain/plans';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { planActionTypeTable } from '../../fiches/shared/models/plan-action-type.table';
import { planPiloteTable } from '../../fiches/shared/models/plan-pilote.table';
import { planReferentTable } from '../../fiches/shared/models/plan-referent.table';
import { GetPlanError, GetPlanErrorEnum } from './get-plan.errors';

export type GetPlanOutput = AxeLight & { type: PlanType | null };

@Injectable()
export class GetPlanRepository {
  private readonly logger = new Logger(GetPlanRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getPlan(
    { planId, collectiviteId }: { planId: number; collectiviteId?: number },
    tx?: Transaction
  ): Promise<Result<GetPlanOutput, GetPlanError>> {
    const whereConditions = [
      eq(axeTable.id, planId),
      isNull(axeTable.parent),
      collectiviteId ? eq(axeTable.collectiviteId, collectiviteId) : undefined,
    ];

    try {
      const result = await (tx || this.databaseService.db)
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
        .where(and(...whereConditions))
        .leftJoin(
          planActionTypeTable,
          eq(axeTable.typeId, planActionTypeTable.id)
        )
        .limit(1);

      if (!result || result.length === 0) {
        return {
          success: false,
          error: GetPlanErrorEnum.PLAN_NOT_FOUND,
        };
      }

      return {
        success: true,
        data: result[0],
      };
    } catch (error) {
      this.logger.error(`Error getting axe ${planId}: ${error}`);
      return {
        success: false,
        error: GetPlanErrorEnum.PLAN_NOT_FOUND,
      };
    }
  }

  async getReferents(
    planId: number,
    tx?: Transaction
  ): Promise<Result<Personne[], GetPlanError>> {
    try {
      const referents = await (tx || this.databaseService.db)
        .select({
          tagId: planReferentTable.tagId,
          userId: planReferentTable.userId,
          userName: sql<
            string | null
          >`CASE WHEN ${userTable.prenom} IS NULL AND ${userTable.nom} IS NULL THEN NULL ELSE TRIM(CONCAT(COALESCE(${userTable.prenom}, ''), ' ', COALESCE(${userTable.nom}, ''))) END`,
          tagName: personneTagTable.nom,
        })
        .from(planReferentTable)
        .leftJoin(userTable, eq(planReferentTable.userId, userTable.id))
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
        error: GetPlanErrorEnum.GET_REFERENTS_ERROR,
      };
    }
  }

  async getPilotes(
    planId: number,
    tx?: Transaction
  ): Promise<Result<Personne[], GetPlanError>> {
    try {
      const pilotes = await (tx || this.databaseService.db)
        .select({
          tagId: planPiloteTable.tagId,
          userId: planPiloteTable.userId,
          userName: sql<
            string | null
          >`CASE WHEN ${userTable.prenom} IS NULL AND ${userTable.nom} IS NULL THEN NULL ELSE TRIM(CONCAT(COALESCE(${userTable.prenom}, ''), ' ', COALESCE(${userTable.nom}, ''))) END`,
          tagName: personneTagTable.nom,
        })
        .from(planPiloteTable)
        .leftJoin(userTable, eq(planPiloteTable.userId, userTable.id))
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
        error: GetPlanErrorEnum.GET_PILOTES_ERROR,
      };
    }
  }
}
