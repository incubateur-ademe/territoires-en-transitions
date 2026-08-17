import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { PersonneId } from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { demarchePiloteTable } from '@tet/backend/demarches/shared/models/demarche-pilote.table';

@Injectable()
export class DemarchePcaetPilotesRepository {
  private readonly logger = new Logger(DemarchePcaetPilotesRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /** Pilotes de la démarche (userId nul pour les pilotes en tag seul). */
  async listPiloteUserIds(
    demarcheId: number,
    tx?: Transaction
  ): Promise<{ userId: string | null }[]> {
    return (tx ?? this.databaseService.db)
      .select({ userId: demarchePiloteTable.userId })
      .from(demarchePiloteTable)
      .where(eq(demarchePiloteTable.demarcheId, demarcheId));
  }

  /** Remplace les pilotes d'une démarche (delete-all + insert, comme plan_pilote). */
  async setPilotes(
    demarcheId: number,
    pilotes: PersonneId[],
    userId: string,
    tx: Transaction
  ): Promise<Result<undefined, 'SET_PILOTES_ERROR'>> {
    try {
      await tx
        .delete(demarchePiloteTable)
        .where(eq(demarchePiloteTable.demarcheId, demarcheId));

      if (pilotes.length > 0) {
        await tx.insert(demarchePiloteTable).values(
          pilotes.map((pilote) => ({
            demarcheId,
            tagId: pilote.tagId,
            userId: pilote.userId,
            createdBy: userId,
          }))
        );
      }
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Error setting pilotes for demarche PCAET ${demarcheId}: ${error}`
      );
      return failure('SET_PILOTES_ERROR');
    }
  }
}
