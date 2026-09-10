import { Injectable, Logger } from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { CategorieAction, LEVIER_ID_BY_NOM, Levier } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { and, eq, inArray } from 'drizzle-orm';
import {
  FicheActionLevierErrorEnum,
  type FicheActionLevierError,
} from './fiche-action-levier.errors';
import { ficheActionLevierTable } from './models/fiche-action-levier.table';

export type LevierCategorie = {
  levier: Levier;
  categorie: CategorieAction;
};

export type FicheActionLeviers = {
  ficheId: number;
  leviers: LevierCategorie[];
};

@Injectable()
export class FicheActionLevierRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(FicheActionLevierRepository.name);

  constructor(private readonly database: DatabaseService) {}

  async saveLeviers({
    collectiviteId,
    fiches,
    createdBy,
    tx,
  }: {
    collectiviteId: number;
    fiches: FicheActionLeviers[];
    createdBy: string;
    tx?: Transaction;
  }): Promise<Result<void, FicheActionLevierError>> {
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
          .delete(ficheActionLevierTable)
          .where(inArray(ficheActionLevierTable.ficheId, [...ownedFicheIds]));

        const assignments = fiches
          .filter(({ ficheId }) => ownedFicheIds.has(ficheId))
          .flatMap(({ ficheId, leviers }) =>
            leviers.map(({ levier, categorie }) => ({
              ficheId,
              levierId: LEVIER_ID_BY_NOM[levier],
              categorie,
              createdBy,
            }))
          );

        if (assignments.length > 0) {
          await runner.insert(ficheActionLevierTable).values(assignments);
        }
      });

      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Écriture des leviers de ${fiches.length} fiches: ${getErrorMessage(
          error
        )}`
      );
      return failure(FicheActionLevierErrorEnum.SAVE_LEVIERS_ERROR);
    }
  }
}
