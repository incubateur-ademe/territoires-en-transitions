import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { MethodResult } from '@tet/backend/utils/result.type';
import { AxeLight } from '@tet/domain/plans';
import { eq } from 'drizzle-orm';
import { axeIndicateurTable } from '../../fiches/shared/models/axe-indicateur.table';
import { axeTable } from '../../fiches/shared/models/axe.table';
import { GetAxeError, GetAxeErrorEnum } from './get-axe.errors';
import { Indicateur } from './get-axe.output';

@Injectable()
export class GetAxeRepository {
  private readonly logger = new Logger(GetAxeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getAxe(
    axeId: number,
    tx?: Transaction
  ): Promise<MethodResult<AxeLight, GetAxeError>> {
    try {
      const result = await (tx || this.databaseService.db)
        .select()
        .from(axeTable)
        .where(eq(axeTable.id, axeId))
        .limit(1);

      if (!result || result.length === 0) {
        return {
          success: false,
          error: GetAxeErrorEnum.AXE_NOT_FOUND,
        };
      }

      const [axe] = result;
      return {
        success: true,
        data: axe,
      };
    } catch (error) {
      this.logger.error(
        `Error getting axe basic info for axe ${axeId}: ${error}`
      );
      return {
        success: false,
        error: GetAxeErrorEnum.SERVER_ERROR,
      };
    }
  }

  async geIndicateurs(
    axeId: number,
    tx?: Transaction
  ): Promise<MethodResult<Indicateur[], GetAxeError>> {
    try {
      const indicateurs = await (tx || this.databaseService.db)
        .select({
          id: indicateurDefinitionTable.id,
          titre: indicateurDefinitionTable.titre,
          unite: indicateurDefinitionTable.unite,
        })
        .from(axeIndicateurTable)
        .innerJoin(
          indicateurDefinitionTable,
          eq(indicateurDefinitionTable.id, axeIndicateurTable.indicateurId)
        )
        .where(eq(axeIndicateurTable.axeId, axeId));

      return {
        success: true,
        data: indicateurs,
      };
    } catch (error) {
      this.logger.error(`Error getting indicateurs for axe ${axeId}: ${error}`);
      return {
        success: false,
        error: GetAxeErrorEnum.GET_INDICATEURS_ERROR,
      };
    }
  }
}
