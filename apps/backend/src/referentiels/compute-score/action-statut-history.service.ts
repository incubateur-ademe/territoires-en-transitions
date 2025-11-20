import { Injectable, Logger } from '@nestjs/common';
import { actionStatutTable } from '@tet/backend/referentiels/models/action-statut.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import MattermostNotificationService from '@tet/backend/utils/mattermost-notification.service';
import { ActionStatut } from '@tet/domain/referentiels';
import {
  aliasedTable,
  and,
  count,
  desc,
  eq,
  getTableColumns,
  isNull,
  or,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import {
  HistoriqueActionStatutInsert,
  historiqueActionStatutTable,
} from '../models/historique-action-statut.table';

@Injectable()
export default class ActionStatutHistoryService {
  private readonly logger = new Logger(ActionStatutHistoryService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mattermostNotificationService: MattermostNotificationService
  ) {}

  async fixMissingActionStatutsHistory() {
    const historiqueActionStatutTableAlias = aliasedTable(
      historiqueActionStatutTable,
      'historique_action_statut'
    );
    const missingHistoriqueActionStatutsResult: { count: number }[] =
      await this.databaseService.db
        .select({
          count: count(),
        })
        .from(actionStatutTable)
        .leftJoin(
          historiqueActionStatutTableAlias,
          and(
            eq(
              actionStatutTable.actionId,
              historiqueActionStatutTableAlias.actionId
            ),
            eq(
              actionStatutTable.collectiviteId,
              historiqueActionStatutTableAlias.collectiviteId
            ),
            eq(
              actionStatutTable.modifiedAt,
              historiqueActionStatutTableAlias.modifiedAt
            )
          )
        )
        .where(isNull(historiqueActionStatutTableAlias.actionId));

    const missingActionStatutsCount =
      missingHistoriqueActionStatutsResult[0].count;
    this.logger.log(
      `Found ${missingActionStatutsCount} missing historique action statuts`
    );

    if (missingActionStatutsCount > 0) {
      await this.mattermostNotificationService.postMessage(
        `:no_entry: Found ${missingActionStatutsCount} missing historique action statuts`
      );

      const chunkSize = 1000;
      const chunkCount = Math.ceil(missingActionStatutsCount / chunkSize);
      for (let i = 0; i < chunkCount; i++) {
        this.logger.log(
          `Processing chunk ${
            i + 1
          }/${chunkCount} of ${chunkSize} missing historique action statuts`
        );

        const missingActionStatuts: ActionStatut[] =
          await this.databaseService.db
            .select({
              ...getTableColumns(actionStatutTable),
            })
            .from(actionStatutTable)
            .leftJoin(
              historiqueActionStatutTableAlias,
              and(
                eq(
                  actionStatutTable.actionId,
                  historiqueActionStatutTableAlias.actionId
                ),
                eq(
                  actionStatutTable.collectiviteId,
                  historiqueActionStatutTableAlias.collectiviteId
                ),
                eq(
                  actionStatutTable.modifiedAt,
                  historiqueActionStatutTableAlias.modifiedAt
                )
              )
            )
            .where(isNull(historiqueActionStatutTableAlias.actionId))
            .limit(chunkSize);

        const actionStatutHistoryToInsert: HistoriqueActionStatutInsert[] =
          missingActionStatuts;

        // TODO: optmize to retrieve most recent over a window function
        const sqlConditionsForPreviousActionStatut: (SQLWrapper | SQL)[] = [];
        missingActionStatuts.forEach((actionStatut) => {
          const condition = and(
            ...[
              eq(historiqueActionStatutTable.actionId, actionStatut.actionId),
              eq(
                historiqueActionStatutTable.collectiviteId,
                actionStatut.collectiviteId
              ),
            ]
          );
          if (condition) {
            sqlConditionsForPreviousActionStatut.push(condition);
          }
        });
        const previousActionStatut = await this.databaseService.db
          .select()
          .from(historiqueActionStatutTable)
          .where(or(...sqlConditionsForPreviousActionStatut))
          .orderBy(desc(historiqueActionStatutTable.modifiedAt));
        this.logger.log(
          `Found ${previousActionStatut.length} previous action statuts`
        );

        previousActionStatut.forEach((previousActionStatut) => {
          const foundActionStatutHistoryToInsert =
            actionStatutHistoryToInsert.find((actionStatutHistory) => {
              return (
                actionStatutHistory.actionId ===
                  previousActionStatut.actionId &&
                actionStatutHistory.collectiviteId ===
                  previousActionStatut.collectiviteId
              );
            });
          if (!foundActionStatutHistoryToInsert) {
            throw new Error(
              'Action statut history to insert not found, no supposed to happen'
            );
          }
          if (!foundActionStatutHistoryToInsert.previousModifiedBy) {
            this.logger.log(
              `Previous action statut found for collectivite ${previousActionStatut.collectiviteId} and action ${previousActionStatut.actionId}`
            );
            foundActionStatutHistoryToInsert.previousAvancement =
              previousActionStatut.avancement;
            foundActionStatutHistoryToInsert.previousAvancementDetaille =
              previousActionStatut.avancementDetaille;
            foundActionStatutHistoryToInsert.previousConcerne =
              previousActionStatut.concerne;
            foundActionStatutHistoryToInsert.previousModifiedBy =
              previousActionStatut.modifiedBy;
            foundActionStatutHistoryToInsert.previousModifiedAt =
              previousActionStatut.modifiedAt;
          } else {
            this.logger.log(
              `Previous already filled for collectivite ${previousActionStatut.collectiviteId} and action ${previousActionStatut.actionId}`
            );
          }
        });

        await this.databaseService.db
          .insert(historiqueActionStatutTable)
          .values(actionStatutHistoryToInsert);

        this.logger.log(
          `Inserted ${actionStatutHistoryToInsert.length} historique action statuts, moving to next chunk`
        );
      }
    }
  }
}
