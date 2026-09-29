import { Injectable, Logger } from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { LEVIER_ID_BY_NOM } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { VoletErrorEnum, type VoletError } from './volet.errors';
import { ficheActionVoletGesTable } from './models/fiche-action-volet-ges.table';
import { FicheVolet } from './pipeline/calculate-mobilisation/group-volets-by-levier';
import { FicheVolets, VoletRepository } from './volet.repository';

@Injectable()
export class FicheActionVoletGesRepository implements VoletRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(FicheActionVoletGesRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async listVolets({
    collectiviteId,
  }: {
    collectiviteId: number;
  }): Promise<Result<FicheVolet[], VoletError>> {
    try {
      const volets = await this.db
        .select({
          ficheId: ficheActionVoletGesTable.ficheId,
          levierId: ficheActionVoletGesTable.levierId,
          categorie: ficheActionVoletGesTable.categorie,
        })
        .from(ficheActionVoletGesTable)
        .innerJoin(
          ficheActionTable,
          eq(ficheActionTable.id, ficheActionVoletGesTable.ficheId)
        )
        .where(
          and(
            eq(ficheActionTable.collectiviteId, collectiviteId),
            eq(ficheActionTable.deleted, false)
          )
        )
        .orderBy(
          asc(ficheActionVoletGesTable.ficheId),
          asc(ficheActionVoletGesTable.levierId),
          asc(ficheActionVoletGesTable.categorie)
        );

      return success(volets);
    } catch (error) {
      this.logger.error(
        `Could not list volets of collectivite ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(VoletErrorEnum.GET_VOLETS_ERROR);
    }
  }

  async deleteVolets({
    ficheIds,
    tx,
  }: {
    ficheIds: readonly number[];
    tx?: Transaction;
  }): Promise<Result<void, VoletError>> {
    try {
      await (tx ?? this.db)
        .delete(ficheActionVoletGesTable)
        .where(inArray(ficheActionVoletGesTable.ficheId, [...ficheIds]));

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Could not delete volets of ${
          ficheIds.length
        } fiches: ${getErrorMessage(error)}`
      );
      return failure(VoletErrorEnum.DELETE_VOLETS_ERROR);
    }
  }

  async saveVolets({
    collectiviteId,
    fiches,
    tx,
  }: {
    collectiviteId: number;
    fiches: FicheVolets[];
    tx?: Transaction;
  }): Promise<Result<void, VoletError>> {
    try {
      await (tx ?? this.db).transaction(async (runner) => {
        const ownedFiches = await runner
          .select({ ficheId: ficheActionTable.id })
          .from(ficheActionTable)
          .where(
            and(
              inArray(
                ficheActionTable.id,
                fiches.map(({ ficheId }) => ficheId)
              ),
              eq(ficheActionTable.collectiviteId, collectiviteId)
            )
          );
        const ownedFicheIds = new Set(
          ownedFiches.map(({ ficheId }) => ficheId)
        );

        if (ownedFicheIds.size === 0) {
          return;
        }

        await runner
          .delete(ficheActionVoletGesTable)
          .where(inArray(ficheActionVoletGesTable.ficheId, [...ownedFicheIds]));

        const assignments = fiches
          .filter(({ ficheId }) => ownedFicheIds.has(ficheId))
          .flatMap(({ ficheId, volets }) =>
            volets.map(({ levier, categorie }) => ({
              ficheId,
              levierId: LEVIER_ID_BY_NOM[levier],
              categorie,
            }))
          );

        if (assignments.length > 0) {
          await runner.insert(ficheActionVoletGesTable).values(assignments);
        }
      });

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Écriture des volets de ${fiches.length} fiches: ${getErrorMessage(
          error
        )}`
      );
      return failure(VoletErrorEnum.SAVE_VOLETS_ERROR);
    }
  }
}
