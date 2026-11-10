import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';

@Injectable()
export class DemarchePcaetDemoRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /** Le plan de démo d'une précédente démonstration, s'il existe encore. */
  async findPlanDemo(
    { collectiviteId, nom }: { collectiviteId: number; nom: string },
    tx?: Transaction
  ): Promise<number | null> {
    const [plan] = await (tx ?? this.databaseService.db)
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(
        and(
          eq(axeTable.collectiviteId, collectiviteId),
          eq(axeTable.nom, nom),
          isNull(axeTable.parent)
        )
      )
      .orderBy(asc(axeTable.id))
      .limit(1);
    return plan?.id ?? null;
  }

  /** Le délai d'avis tombe maintenant : la clôture le constatera échu. */
  async echoirDelaiAvis(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<void> {
    await (tx ?? this.databaseService.db)
      .update(demarcheTable)
      .set({ avisDeadlineAt: sql`now()` })
      .where(
        and(
          eq(demarcheTable.id, demarcheId),
          eq(demarcheTable.collectiviteId, collectiviteId)
        )
      );
  }
}
