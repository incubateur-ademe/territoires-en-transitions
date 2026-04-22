import { Injectable } from '@nestjs/common';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { eq } from 'drizzle-orm';

@Injectable()
export class GetActionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(
    actionId: string,
    tx?: Transaction
  ): Promise<{ id: string } | null> {
    const [row] = await (tx ?? this.databaseService.db)
      .select({ id: actionRelationTable.id })
      .from(actionRelationTable)
      .where(eq(actionRelationTable.id, actionId))
      .limit(1);
    return row ?? null;
  }
}
