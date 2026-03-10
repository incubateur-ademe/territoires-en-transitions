import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { referentielDefinitionTable } from '@tet/backend/referentiels/models/referentiel-definition.table';
import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { ActionType, ReferentielId } from '@tet/domain/referentiels';
import { eq, getTableColumns, inArray } from 'drizzle-orm';
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
        createdAt: sqlToDateTimeISO(referentielDefinitionTable.createdAt),
        modifiedAt: sqlToDateTimeISO(referentielDefinitionTable.modifiedAt),
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
        createdAt: sqlToDateTimeISO(referentielDefinitionTable.createdAt),
        modifiedAt: sqlToDateTimeISO(referentielDefinitionTable.modifiedAt),
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

  async getHierarchiesByReferentielIds(
    referentielIds: ReferentielId[]
  ): Promise<ReadonlyMap<ReferentielId, ActionType[]>> {
    if (referentielIds.length === 0) {
      return new Map();
    }

    const rows = await this.databaseService.db
      .select({
        id: referentielDefinitionTable.id,
        hierarchie: referentielDefinitionTable.hierarchie,
      })
      .from(referentielDefinitionTable)
      .where(inArray(referentielDefinitionTable.id, referentielIds));

    return new Map(rows.map((r) => [r.id, r.hierarchie]));
  }
}
