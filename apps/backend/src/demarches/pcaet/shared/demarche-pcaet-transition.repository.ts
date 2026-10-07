import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type {
  DemarchePcaetStatus,
  DemarchePcaetTransition,
} from '@tet/domain/demarches';
import { and, eq } from 'drizzle-orm';
import type { DemarchePcaetRef } from './demarche-pcaet-ref.repository';
import type { DemarchePcaetTransitionStamps } from './demarche-pcaet-transition.service';
import { demarcheStatusHistoryTable } from '@tet/backend/demarches/shared/models/demarche-status-history.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';

@Injectable()
export class DemarchePcaetTransitionRepository {
  private readonly logger = new Logger(DemarchePcaetTransitionRepository.name);

  /**
   * Persiste un changement d'état et sa ligne d'history dans la même
   * opération. Le collectiviteId sert de filtre (règle IDOR) et ne fait
   * jamais partie du SET.
   *
   * `userId` est nul pour les transitions système (avis tous rendus, délai
   * échu) : personne ne les a demandées, et le journal doit le dire plutôt que
   * d'imputer la bascule au dernier utilisateur passé par là.
   */
  async persistTransition(
    demarche: DemarchePcaetRef,
    toStatus: DemarchePcaetStatus,
    transition: DemarchePcaetTransition,
    userId: string | null,
    stamps: DemarchePcaetTransitionStamps,
    tx: Transaction
  ): Promise<Result<undefined, 'DATABASE_ERROR'>> {
    try {
      await tx
        .update(demarcheTable)
        .set({
          status: toStatus,
          ...stamps,
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
