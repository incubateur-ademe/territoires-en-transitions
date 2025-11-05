import { referentielDefinitionTable } from '@/backend/referentiels/models/referentiel-definition.table';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import { DatabaseService } from '@/backend/utils/database/database.service';
import type { ReferentielId } from '@/domain/referentiels';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq, getTableColumns } from 'drizzle-orm';
import { GetReferentielDefinitionOutput } from './get-referentiel-definition.output';

@Injectable()
export class GetReferentielDefinitionService {
  private readonly logger = new Logger(GetReferentielDefinitionService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async getReferentielDefinitions(): Promise<GetReferentielDefinitionOutput[]> {
    this.logger.log(`Getting referentiel definitions`);

    const referentielDefinitions = await this.databaseService.db
      .select({
        ...getTableColumns(referentielDefinitionTable),
        createdAt: getISOFormatDateQuery(referentielDefinitionTable.createdAt),
        modifiedAt: getISOFormatDateQuery(
          referentielDefinitionTable.modifiedAt
        ),
      })
      .from(referentielDefinitionTable);

    return referentielDefinitions;
  }

  async getReferentielDefinition(
    referentielId: ReferentielId
  ): Promise<GetReferentielDefinitionOutput> {
    this.logger.log(`Getting referentiel definition for ${referentielId}`);

    const referentielDefinitions = await this.databaseService.db
      .select({
        ...getTableColumns(referentielDefinitionTable),
        createdAt: getISOFormatDateQuery(referentielDefinitionTable.createdAt),
        modifiedAt: getISOFormatDateQuery(
          referentielDefinitionTable.modifiedAt
        ),
      })
      .from(referentielDefinitionTable)
      .where(eq(referentielDefinitionTable.id, referentielId))
      .limit(1);

    if (!referentielDefinitions.length) {
      throw new NotFoundException(
        `Referentiel definition ${referentielId} not found`
      );
    }

    return referentielDefinitions[0];
  }
}
