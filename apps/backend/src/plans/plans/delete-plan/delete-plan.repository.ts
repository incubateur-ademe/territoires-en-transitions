import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { MethodResult } from '@tet/backend/utils/result.type';
import { and, eq } from 'drizzle-orm';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '../../fiches/shared/models/fiche-action-axe.table';
import { planPiloteTable } from '../../fiches/shared/models/plan-pilote.table';
import { planReferentTable } from '../../fiches/shared/models/plan-referent.table';
import { DeletePlanError, DeletePlanErrorEnum } from './delete-plan.errors';

@Injectable()
export class DeletePlanRepository {
  private readonly logger = new Logger(DeletePlanRepository.name);

  async deletePlanAndChildrenAxes(
    planId: number,
    tx: Transaction
  ): Promise<MethodResult<{ impactedFicheIds: number[] }, DeletePlanError>> {
    const childAxesResult = await this.getChildAxesRecursively(planId, tx);
    if (!childAxesResult.success) {
      return {
        success: false,
        error: DeletePlanErrorEnum.DELETE_PLAN_ERROR,
      };
    }

    const childAxes = childAxesResult.data;
    const impactedFicheIds: number[] = [];

    // Delete all child axes first (in reverse order to avoid foreign key constraints)
    for (const childId of childAxes.reverse()) {
      const deleteResult = await this.deleteAxeDataOnly(childId, tx);
      if (!deleteResult.success) {
        return {
          success: false,
          error: DeletePlanErrorEnum.DELETE_PLAN_ERROR,
        };
      }
      impactedFicheIds.push(...deleteResult.data.impactedFicheIds);
    }

    const mainDeleteResult = await this.deleteAxeDataOnly(planId, tx);
    if (!mainDeleteResult.success) {
      return {
        success: false,
        error: DeletePlanErrorEnum.DELETE_PLAN_ERROR,
      };
    }
    impactedFicheIds.push(...mainDeleteResult.data.impactedFicheIds);

    this.logger.log(
      `Deleted plan ${planId} and ${childAxes.length} child axes`
    );
    return {
      success: true,
      data: { impactedFicheIds },
    };
  }

  private async getChildAxesRecursively(
    axeId: number,
    tx: Transaction
  ): Promise<MethodResult<number[], DeletePlanError>> {
    try {
      const children = await tx
        .select({ id: axeTable.id })
        .from(axeTable)
        .where(eq(axeTable.parent, axeId));

      const allChildren: number[] = [];
      for (const child of children) {
        allChildren.push(child.id);
        const grandChildrenResult = await this.getChildAxesRecursively(
          child.id,
          tx
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
        error: DeletePlanErrorEnum.DELETE_PLAN_ERROR,
      };
    }
  }

  private async deleteAxeDataOnly(
    axeId: number,
    tx: Transaction
  ): Promise<MethodResult<{ impactedFicheIds: number[] }, DeletePlanError>> {
    try {
      const associatedFiches = await tx
        .select({ ficheId: ficheActionAxeTable.ficheId })
        .from(ficheActionAxeTable)
        .where(eq(ficheActionAxeTable.axeId, axeId));

      const impactedFicheIds: number[] = [];

      for (const { ficheId } of associatedFiches) {
        if (ficheId === null) continue;

        await tx
          .delete(ficheActionAxeTable)
          .where(
            and(
              eq(ficheActionAxeTable.ficheId, ficheId),
              eq(ficheActionAxeTable.axeId, axeId)
            )
          );

        const remainingAssociations = await tx
          .select()
          .from(ficheActionAxeTable)
          .where(eq(ficheActionAxeTable.ficheId, ficheId));

        const isFicheOrphan = remainingAssociations.length === 0;
        if (isFicheOrphan) {
          impactedFicheIds.push(ficheId);
        }
      }

      // Delete plan referents
      await tx
        .delete(planReferentTable)
        .where(eq(planReferentTable.planId, axeId));

      // Delete plan pilotes
      await tx.delete(planPiloteTable).where(eq(planPiloteTable.planId, axeId));

      // Delete the axe itself
      await tx.delete(axeTable).where(eq(axeTable.id, axeId));

      return {
        success: true,
        data: { impactedFicheIds },
      };
    } catch (error) {
      this.logger.error(`Error deleting axe data for axe ${axeId}: ${error}`);
      return {
        success: false,
        error: DeletePlanErrorEnum.DELETE_PLAN_ERROR,
      };
    }
  }
}
