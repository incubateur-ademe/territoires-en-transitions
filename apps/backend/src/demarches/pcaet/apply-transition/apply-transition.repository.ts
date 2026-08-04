import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type {
  DemarchePcaetStatus,
  DemarchePcaetTransition,
} from '@tet/domain/demarches';
import { and, eq } from 'drizzle-orm';
import type { DemarchePcaetRef } from '../shared/demarche-pcaet-ref.repository';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';

@Injectable()
export class ApplyTransitionRepository {
  private readonly logger = new Logger(ApplyTransitionRepository.name);

  /**
   * Persiste un changement de statut et sa ligne d'history dans la même
   * opération. Le collectiviteId sert de filtre (règle IDOR) et ne fait
   * jamais partie du SET.
   */
  async persistTransition(
    demarche: DemarchePcaetRef,
    toStatus: DemarchePcaetStatus,
    transition: DemarchePcaetTransition,
    userId: string,
    // Dates figées à la transmission pour avis (écrasées à la retransmission).
    transmission: { transmittedAt: string; avisDeadlineAt: string } | undefined,
    tx: Transaction
  ): Promise<Result<undefined, 'DATABASE_ERROR'>> {
    try {
      await tx
        .update(demarcheTable)
        .set({
          status: toStatus,
          ...(transmission ?? {}),
          modifiedAt: new Date().toISOString(),
          modifiedBy: userId,
        })
        .where(
          and(
            eq(demarcheTable.id, demarche.id),
            eq(demarcheTable.collectiviteId, demarche.collectiviteId)
          )
        );

      await tx.insert(demarcheStatusHistoryTable).values({
        demarcheId: demarche.id,
        fromStatus: demarche.status,
        toStatus,
        transition,
        createdBy: userId,
      });

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Error applying transition ${transition} on demarche PCAET ${demarche.id}: ${error}`
      );
      return failure('DATABASE_ERROR');
    }
  }
}
