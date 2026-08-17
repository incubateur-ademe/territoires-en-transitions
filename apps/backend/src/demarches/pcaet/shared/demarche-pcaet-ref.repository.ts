import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  DemarcheTypeEnum,
  type DemarchePcaetStatus,
} from '@tet/domain/demarches';
import { and, eq } from 'drizzle-orm';
import { sqlToNullableDateTimeISO } from './models/demarche-pcaet.dto';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';

export type DemarchePcaetRef = {
  id: number;
  collectiviteId: number;
  status: DemarchePcaetStatus;
  publishedAt: string | null;
  transmittedAt: string | null;
  avisDeadlineAt: string | null;
  planActionId: number | null;
};

/**
 * Lookup partagé d'une démarche : le WHERE couple systématiquement id et
 * collectiviteId (règle IDOR) — c'est le seul endroit où l'écrire.
 */
@Injectable()
export class DemarchePcaetRefRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findRef(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    options?: { forUpdate?: boolean },
    tx?: Transaction
  ): Promise<DemarchePcaetRef | undefined> {
    const db = tx || this.databaseService.db;
    const query = db
      .select({
        id: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
        status: demarcheTable.status,
        publishedAt: demarcheTable.publishedAt,
        transmittedAt: sqlToNullableDateTimeISO(demarcheTable.transmittedAt),
        avisDeadlineAt: sqlToNullableDateTimeISO(demarcheTable.avisDeadlineAt),
        planActionId: demarcheTable.planActionId,
      })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.id, demarcheId),
          eq(demarcheTable.collectiviteId, collectiviteId),
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET)
        )
      )
      .limit(1);

    // Verrou de ligne optionnel : les écritures concurrentes se sérialisent au
    // lieu de valider toutes deux contre le même état périmé.
    const rows = await (options?.forUpdate ? query.for('update') : query);
    return rows[0];
  }
}
