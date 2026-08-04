import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { and, eq } from 'drizzle-orm';
import type { DemarchePcaetRef } from '../shared/demarche-pcaet-ref.repository';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';

@Injectable()
export class DeleteDemarchePcaetRepository {
  private readonly logger = new Logger(DeleteDemarchePcaetRepository.name);

  /** Suppression définitive : les FK en cascade nettoient pilotes et history. */
  async deleteDemarche(
    ref: Pick<DemarchePcaetRef, 'id' | 'collectiviteId'>,
    tx: Transaction
  ): Promise<Result<undefined, 'DATABASE_ERROR'>> {
    try {
      await tx
        .delete(demarcheTable)
        .where(
          and(
            eq(demarcheTable.id, ref.id),
            eq(demarcheTable.collectiviteId, ref.collectiviteId)
          )
        );
      return success(undefined);
    } catch (error) {
      this.logger.error(`Error deleting demarche PCAET ${ref.id}: ${error}`);
      return failure('DATABASE_ERROR');
    }
  }
}
