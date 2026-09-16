import { Injectable, Logger } from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { LEVIER_ID_BY_NOM } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray } from 'drizzle-orm';
import { VoletErrorEnum, type VoletError } from './volet.errors';
import { ficheActionVoletGesTable } from './models/fiche-action-volet-ges.table';
import { FicheVolets, VoletRepository } from './volet.repository';
import { FicheVolet } from './pipeline/calculate-mobilisation/group-volets-by-levier';

@Injectable()
export class FicheActionVoletGesRepository implements VoletRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(FicheActionVoletGesRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async listVoletsOfFiches(
    ficheIds: number[]
  ): Promise<Result<FicheVolet[], VoletError>> {
    if (ficheIds.length === 0) {
      return success([]);
    }

    try {
      const volets = await this.db
        .select({
          ficheId: ficheActionVoletGesTable.ficheId,
          levierId: ficheActionVoletGesTable.levierId,
          categorie: ficheActionVoletGesTable.categorie,
        })
        .from(ficheActionVoletGesTable)
        .where(inArray(ficheActionVoletGesTable.ficheId, ficheIds));

      return success(volets);
    } catch (error) {
      this.logger.error(
        `Lecture des volets de ${ficheIds.length} fiches: ${getErrorMessage(
          error
        )}`
      );
      return failure(VoletErrorEnum.GET_VOLETS_ERROR);
    }
  }

  async saveVolets({
    collectiviteId,
    fiches,
    createdBy,
    tx,
  }: {
    collectiviteId: number;
    fiches: FicheVolets[];
    createdBy: string;
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
              createdBy,
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
