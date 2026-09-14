import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { IndicateurDefinition } from '@tet/domain/indicateurs';
import { inArray } from 'drizzle-orm';

@Injectable()
export class IndicateurDefinitionsRepository {
  private readonly logger = new Logger(IndicateurDefinitionsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listByIds(ids: number[]): Promise<IndicateurDefinition[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      return await this.databaseService.db
        .select()
        .from(indicateurDefinitionTable)
        .where(inArray(indicateurDefinitionTable.id, ids));
    } catch (error) {
      this.logger.warn(
        `Impossible de charger les indicateur-definitions ${ids.join(
          ', '
        )} : ${error}`
      );
      return [];
    }
  }
}
