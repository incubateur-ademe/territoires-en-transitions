import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { MethodResult } from '@tet/backend/utils/result.type';
import { inArray } from 'drizzle-orm';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { DeleteAxeError, DeleteAxeErrorEnum } from './delete-axe.errors';

@Injectable()
export class DeleteAxeRepository {
  private readonly logger = new Logger(DeleteAxeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async deleteAxes(
    axeIds: number[],
    tx?: Transaction
  ): Promise<MethodResult<void, DeleteAxeError>> {
    if (axeIds.length === 0) {
      return {
        success: true,
        data: undefined,
      };
    }

    try {
      const db = tx || this.databaseService.db;
      await db.delete(axeTable).where(inArray(axeTable.id, axeIds));

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      this.logger.error(`Error deleting axes ${axeIds.join(', ')}: ${error}`);
      return {
        success: false,
        error: DeleteAxeErrorEnum.DELETE_AXES_ERROR,
      };
    }
  }
}
