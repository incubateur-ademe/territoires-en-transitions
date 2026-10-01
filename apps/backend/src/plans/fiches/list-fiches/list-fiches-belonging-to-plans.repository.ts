import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, eq, inArray, isNull, or } from 'drizzle-orm';
import { axeTable } from '../shared/models/axe.table';
import { ficheActionAxeTable } from '../shared/models/fiche-action-axe.table';
import { ficheActionTable } from '../shared/models/fiche-action.table';

@Injectable()
export class ListFichesBelongingToPlansRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  listFichesBelongingToPlans(
    {
      planIds,
      includeFichesRestreintes,
    }: { planIds: number[]; includeFichesRestreintes: boolean },
    { tx }: { tx?: Transaction } = {}
  ) {
    const fichesRestreintesCondition = includeFichesRestreintes
      ? undefined
      : or(
          isNull(ficheActionTable.restreint),
          eq(ficheActionTable.restreint, false)
        );

    return (tx ?? this.databaseService.db)
      .select({
        ficheId: ficheActionAxeTable.ficheId,
        planId: axeTable.plan,
      })
      .from(ficheActionAxeTable)
      .leftJoin(axeTable, eq(ficheActionAxeTable.axeId, axeTable.id))
      .leftJoin(
        ficheActionTable,
        eq(ficheActionTable.id, ficheActionAxeTable.ficheId)
      )
      .where(
        and(
          or(inArray(axeTable.plan, planIds), inArray(axeTable.id, planIds)),
          eq(ficheActionTable.deleted, false),
          fichesRestreintesCondition
        )
      );
  }
}
