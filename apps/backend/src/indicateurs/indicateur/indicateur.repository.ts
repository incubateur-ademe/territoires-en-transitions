import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Result, success } from '@tet/backend/utils/result.type';
import type { Indicateur } from '@tet/domain/indicateurs';
import { getTableColumns, inArray } from 'drizzle-orm';
import {
  type IndicateurRow,
  validateIndicateurs,
} from '../definitions/indicateur.adapter';
import { indicateurDefinitionPeriodiciteSelection } from '../definitions/indicateur-periodicite.column';

@Injectable()
export class IndicateurRepository {
  private readonly logger = new Logger(IndicateurRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listByIds(
    ids: number[]
  ): Promise<Result<Indicateur[], 'DATABASE_ERROR'>> {
    if (ids.length === 0) {
      return success([]);
    }

    return validateIndicateurs(await this.selectByIds(ids));
  }

  private async selectByIds(ids: number[]): Promise<IndicateurRow[]> {
    try {
      return await this.databaseService.db
        .select({
          ...getTableColumns(indicateurDefinitionTable),
          ...indicateurDefinitionPeriodiciteSelection,
        })
        .from(indicateurDefinitionTable)
        .where(inArray(indicateurDefinitionTable.id, ids));
    } catch (error) {
      this.logger.warn(
        `Impossible de charger les indicateurs ${ids.join(', ')} : ${error}`
      );
      return [];
    }
  }
}
