import { Injectable, Logger } from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { CategorieAction, LEVIER_ID_BY_NOM, Levier } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray } from 'drizzle-orm';
import {
  FicheActionVoletGesErrorEnum,
  type FicheActionVoletGesError,
} from './fiche-action-volet-ges.errors';
import { ficheActionVoletGesTable } from './models/fiche-action-volet-ges.table';

export type VoletGes = {
  levier: Levier;
  categorie: CategorieAction;
};

export type FicheActionVoletGes = {
  ficheId: number;
  volets: VoletGes[];
};

@Injectable()
export class FicheActionVoletGesRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(FicheActionVoletGesRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async saveVolets({
    collectiviteId,
    fiches,
    createdBy,
    tx,
  }: {
    collectiviteId: number;
    fiches: FicheActionVoletGes[];
    createdBy: string;
    tx?: Transaction;
  }): Promise<Result<void, FicheActionVoletGesError>> {
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
      return failure(FicheActionVoletGesErrorEnum.SAVE_VOLETS_ERROR);
    }
  }
}
