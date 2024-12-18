import { Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DatabaseService } from '../../utils/database/database.service';
import { axeTable, AxeType } from './shared/models/axe.table';

@Injectable()
export default class PlanActionsService {
  private readonly logger = new Logger(PlanActionsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async list(collectiviteId: number): Promise<AxeType[]> {
    return this.databaseService.db
      .select()
      .from(axeTable)
      .where(
        and(
          eq(axeTable.collectiviteId, collectiviteId),
          isNull(axeTable.parent)
        )
      );
  }
}
