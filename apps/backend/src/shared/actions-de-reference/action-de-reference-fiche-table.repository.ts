import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { asc, eq } from 'drizzle-orm';
import { ActionDeReferenceFicheRepository } from './action-de-reference-fiche.repository';
import { ActionsDeReferenceErrorEnum } from './actions-de-reference.errors';
import { actionDeReferenceFicheTable } from './models/action-de-reference-fiche.table';

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
    tx,
  }) => {
    try {
      const rows = await (tx ?? this.database.db)
        .select({ ficheId: actionDeReferenceFicheTable.ficheId })
        .from(actionDeReferenceFicheTable)
        .where(
          eq(
            actionDeReferenceFicheTable.actionDeReferenceId,
            actionDeReferenceId
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
}
