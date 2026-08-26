import { Injectable } from '@nestjs/common';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  DemarchePcaetStatusEnum,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { and, eq, isNotNull, lte } from 'drizzle-orm';

@Injectable()
export class CloreInstructionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Les dossiers dont le délai d'avis est échu et qui attendent encore la
   * bascule. Volontairement limité au strict nécessaire pour appeler la
   * transition : chaque dossier est ensuite traité dans sa propre transaction,
   * sous verrou, et c'est là que les guards font autorité.
   */
  async listInstructionsEchues(
    now: Date,
    tx?: Transaction
  ): Promise<{ demarcheId: number; collectiviteId: number }[]> {
    return (tx ?? this.databaseService.db)
      .select({
        demarcheId: demarcheTable.id,
        collectiviteId: demarcheTable.collectiviteId,
      })
      .from(demarcheTable)
      .where(
        and(
          eq(demarcheTable.type, DemarcheTypeEnum.PCAET),
          eq(demarcheTable.status, DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS),
          isNotNull(demarcheTable.avisDeadlineAt),
          lte(demarcheTable.avisDeadlineAt, now.toISOString())
        )
      );
  }
}
