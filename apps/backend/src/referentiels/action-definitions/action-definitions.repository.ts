import { Injectable, Logger } from '@nestjs/common';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { ActionDefinition } from '@tet/domain/referentiels';
import { inArray } from 'drizzle-orm';

export type ActionDefinitionSummary = Pick<
  ActionDefinition,
  'actionId' | 'identifiant' | 'nom' | 'referentiel'
>;

@Injectable()
export class ActionDefinitionsRepository {
  private readonly logger = new Logger(ActionDefinitionsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listByActionIds(
    actionIds: string[]
  ): Promise<ActionDefinitionSummary[]> {
    if (actionIds.length === 0) {
      return [];
    }

    try {
      const rows = await this.databaseService.db
        .select({
          actionId: actionDefinitionTable.actionId,
          identifiant: actionDefinitionTable.identifiant,
          nom: actionDefinitionTable.nom,
          referentiel: actionDefinitionTable.referentiel,
        })
        .from(actionDefinitionTable)
        .where(inArray(actionDefinitionTable.actionId, actionIds));

      return rows;
    } catch (error) {
      this.logger.warn(
        `Impossible de charger les action-definitions ${actionIds.join(
          ', '
        )} : ${error}`
      );
      return [];
    }
  }
}
