import { Injectable } from '@nestjs/common';
import { demarchePlanActionTable } from '@tet/backend/demarches/shared/models/demarche-plan-action.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { DEMARCHE_PCAET_EN_COURS_STATUSES } from '@tet/domain/demarches';
import { and, asc, eq, inArray, isNull, ne, notExists, sql } from 'drizzle-orm';

@Injectable()
export class DemarchePcaetDemoRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Le plan de démo d'une précédente démonstration, s'il existe encore et
   * qu'aucune autre démarche en cours ne le tient : l'exclusivité refuserait
   * le rattachement, et son trigger interromprait la transaction.
   */
  async findPlanDemo(
    {
      collectiviteId,
      demarcheId,
      nom,
    }: { collectiviteId: number; demarcheId: number; nom: string },
    tx?: Transaction
  ): Promise<number | null> {
    const db = tx ?? this.databaseService.db;
    const [plan] = await db
      .select({ id: axeTable.id })
      .from(axeTable)
      .where(
        and(
          eq(axeTable.collectiviteId, collectiviteId),
          eq(axeTable.nom, nom),
          isNull(axeTable.parent),
          notExists(
            db
              .select({ id: demarchePlanActionTable.planActionId })
              .from(demarchePlanActionTable)
              .innerJoin(
                demarcheTable,
                eq(demarcheTable.id, demarchePlanActionTable.demarcheId)
              )
              .where(
                and(
                  eq(demarchePlanActionTable.planActionId, axeTable.id),
                  ne(demarchePlanActionTable.demarcheId, demarcheId),
                  inArray(demarcheTable.status, [
                    ...DEMARCHE_PCAET_EN_COURS_STATUSES,
                  ])
                )
              )
          )
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
