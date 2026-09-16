import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { LevierId } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { eq } from 'drizzle-orm';
import {
  GridRepository,
  GridVolet,
  LevierGrid,
  ScoredLevier,
} from './grid.repository';
import { collectiviteVoletGesTable } from './models/collectivite-volet-ges.table';
import { VoletErrorEnum, type VoletError } from './volet.errors';

@Injectable()
export class CollectiviteVoletGesRepository implements GridRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(CollectiviteVoletGesRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async replaceGrid({
    collectiviteId,
    leviers,
    tx,
  }: {
    collectiviteId: number;
    leviers: ScoredLevier[];
    tx?: Transaction;
  }): Promise<Result<void, VoletError>> {
    const runner = tx ?? this.db;

    const rows = leviers.flatMap(({ levierId, volets }) =>
      volets.map(({ categorie, note, ficheIds }) => ({
        collectiviteId,
        levierId,
        categorie,
        note,
        ficheIds,
      }))
    );

    try {
      await runner
        .delete(collectiviteVoletGesTable)
        .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));

      if (rows.length > 0) {
        await runner.insert(collectiviteVoletGesTable).values(rows);
      }

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Ecriture de la grille de mobilisation de la collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(VoletErrorEnum.SAVE_VOLETS_ERROR);
    }
  }

  async getGrid(
    collectiviteId: number
  ): Promise<Result<LevierGrid[], VoletError>> {
    try {
      const rows = await this.db
        .select({
          levierId: collectiviteVoletGesTable.levierId,
          categorie: collectiviteVoletGesTable.categorie,
          note: collectiviteVoletGesTable.note,
          ficheIds: collectiviteVoletGesTable.ficheIds,
        })
        .from(collectiviteVoletGesTable)
        .where(eq(collectiviteVoletGesTable.collectiviteId, collectiviteId));

      const byLevier = rows.reduce<Map<LevierId, GridVolet[]>>(
        (acc, { levierId, categorie, note, ficheIds }) =>
          acc.set(levierId, [
            ...(acc.get(levierId) ?? []),
            { categorie, note, ficheIds },
          ]),
        new Map()
      );

      return success(
        [...byLevier.entries()].map(([levierId, volets]) => ({
          levierId,
          volets,
        }))
      );
    } catch (error) {
      this.logger.error(
        `Lecture de la grille de mobilisation de la collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(VoletErrorEnum.GET_VOLETS_ERROR);
    }
  }
}
