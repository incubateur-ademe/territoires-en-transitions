import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { eq, getTableColumns } from 'drizzle-orm';
import { axeTable, AxeType } from '../../fiches/shared/models/axe.table';
import {
  PlanActionType,
  planActionTypeTable,
} from '../../fiches/shared/models/plan-action-type.table';
import { GetAxeError, GetAxeErrorEnum } from './get-axe.errors';

export type GetAxeOutput = AxeType & { planType: PlanActionType | null };

@Injectable()
export class GetAxeRepository {
  private readonly logger = new Logger(GetAxeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getAxe(
    axeId: number,
    tx?: Transaction
  ): Promise<MethodResult<GetAxeOutput, GetAxeError>> {
    try {
      const result = await (tx || this.databaseService.db)
        .select({
          ...getTableColumns(axeTable),
          planType: planActionTypeTable,
        })
        .from(axeTable)
        .where(eq(axeTable.id, axeId))
        .leftJoin(
          planActionTypeTable,
          eq(axeTable.typeId, planActionTypeTable.id)
        )
        .limit(1);

      if (!result || result.length === 0) {
        return {
          success: false,
          error: GetAxeErrorEnum.AXE_NOT_FOUND,
        };
      }

      const [axe] = result;
      return {
        success: true,
        data: axe,
      };
    } catch (error) {
      this.logger.error(
        `Error getting axe basic info for axe ${axeId}: ${error}`
      );
      return {
        success: false,
        error: GetAxeErrorEnum.SERVER_ERROR,
      };
    }
  }
}
