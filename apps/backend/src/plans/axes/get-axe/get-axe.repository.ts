import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { AxeLight } from '@tet/domain/plans';
import { eq } from 'drizzle-orm';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { GetAxeError, GetAxeErrorEnum } from './get-axe.errors';

@Injectable()
export class GetAxeRepository {
  private readonly logger = new Logger(GetAxeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getAxe(
    axeId: number,
    tx?: Transaction
  ): Promise<Result<AxeLight, GetAxeError>> {
    try {
      const result = await (tx || this.databaseService.db)
        .select()
        .from(axeTable)
        .where(eq(axeTable.id, axeId))
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
