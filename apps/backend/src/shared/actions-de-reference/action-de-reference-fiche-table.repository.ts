import { Injectable, Logger } from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { and, asc, eq, inArray, ne, SQL } from 'drizzle-orm';
import { ActionDeReferenceFicheRepository } from './action-de-reference-fiche.repository';
import { ActionsDeReferenceErrorEnum } from './actions-de-reference.errors';
import { actionDeReferenceFicheTable } from './models/action-de-reference-fiche.table';

const toExcludedCollectiviteCondition = (
  excludedCollectiviteId: number | undefined
): SQL | undefined => {
  if (excludedCollectiviteId === undefined) {
    return undefined;
  }
  return ne(ficheActionTable.collectiviteId, excludedCollectiviteId);
};

@Injectable()
export class ActionDeReferenceFicheTableRepository extends ActionDeReferenceFicheRepository {
  private readonly logger = new Logger(
    ActionDeReferenceFicheTableRepository.name
  );

  constructor(private readonly database: DatabaseService) {
    super();
  }

  listFicheIds: ActionDeReferenceFicheRepository['listFicheIds'] = async ({
    actionDeReferenceId,
    excludedCollectiviteId,
    tx,
  }) => {
    try {
      const rows = await (tx ?? this.database.db)
        .select({ ficheId: actionDeReferenceFicheTable.ficheId })
        .from(actionDeReferenceFicheTable)
        .innerJoin(
          ficheActionTable,
          eq(ficheActionTable.id, actionDeReferenceFicheTable.ficheId)
        )
        .where(
          and(
            eq(
              actionDeReferenceFicheTable.actionDeReferenceId,
              actionDeReferenceId
            ),
            toExcludedCollectiviteCondition(excludedCollectiviteId)
          )
        )
        .orderBy(asc(actionDeReferenceFicheTable.ficheId));
      return success(rows.map(({ ficheId }) => ficheId));
    } catch (error) {
      this.logger.error(
        `Could not list the fiches of the action de référence ${actionDeReferenceId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ActionsDeReferenceErrorEnum.DATABASE_ERROR);
    }
  };

  listFicheParents: ActionDeReferenceFicheRepository['listFicheParents'] =
    async ({ ficheIds, tx }) => {
      try {
        const fiches = await (tx ?? this.database.db)
          .select({
            id: ficheActionTable.id,
            parentId: ficheActionTable.parentId,
          })
          .from(ficheActionTable)
          .where(inArray(ficheActionTable.id, [...ficheIds]));
        return success(fiches);
      } catch (error) {
        this.logger.error(
          `Could not list the parents of the fiches ${ficheIds.join(
            ', '
          )}: ${getErrorMessage(error)}`
        );
        return failure(ActionsDeReferenceErrorEnum.DATABASE_ERROR);
      }
    };

  replaceFiches: ActionDeReferenceFicheRepository['replaceFiches'] = async ({
    actionDeReferenceId,
    ficheIds,
    tx,
  }) => {
    try {
      await (tx ?? this.database.db).transaction(async (replaceTx) => {
        await replaceTx
          .delete(actionDeReferenceFicheTable)
          .where(
            eq(
              actionDeReferenceFicheTable.actionDeReferenceId,
              actionDeReferenceId
            )
          );
        if (ficheIds.length > 0) {
          await replaceTx
            .insert(actionDeReferenceFicheTable)
            .values(
              ficheIds.map((ficheId) => ({ actionDeReferenceId, ficheId }))
            );
        }
      });
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Could not replace the fiches of the action de référence ${actionDeReferenceId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(ActionsDeReferenceErrorEnum.DATABASE_ERROR);
    }
  };
}
