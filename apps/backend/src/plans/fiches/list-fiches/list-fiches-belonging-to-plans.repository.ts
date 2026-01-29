import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { eq, inArray, or } from 'drizzle-orm';
import { axeTable } from '../shared/models/axe.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';

@Injectable()
export class ListFichesBelongingToPlansRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  listFichesBelongingToPlans({ planIds }: { planIds: number[] }) {
    return this.databaseService.db
      .select({
        ficheId: ficheActionAxeTable.ficheId,
        planId: axeTable.plan,
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
      .where(
        or(inArray(axeTable.plan, planIds), inArray(axeTable.id, planIds))
      );
  }
}
