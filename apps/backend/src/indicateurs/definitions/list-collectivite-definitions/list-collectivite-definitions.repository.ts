import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurDefinitionPeriodiciteSelection } from '@tet/backend/indicateurs/definitions/indicateur-periodicite.column';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { IndicateurDefinition } from '@tet/domain/indicateurs';
import {
  and,
  eq,
  getTableColumns,
  inArray,
  isNull,
  or,
  SQLWrapper,
} from 'drizzle-orm';

@Injectable()
export class ListCollectiviteDefinitionsRepository {
  private readonly logger = new Logger(
    ListCollectiviteDefinitionsRepository.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

  async listCollectiviteDefinitions({
    identifiantsReferentiel,
    indicateurIds,
    collectiviteId,
  }: {
    identifiantsReferentiel?: string[];
    indicateurIds?: number[];
    collectiviteId?: number;
  } = {}): Promise<IndicateurDefinition[]> {
    this.logger.log(
      `Récupération des définitions des indicateurs ${identifiantsReferentiel?.join(
        ','
      )}`
    );

    const byIdentifiantReferentiels =
      identifiantsReferentiel && identifiantsReferentiel.length
        ? inArray(
            indicateurDefinitionTable.identifiantReferentiel,
            identifiantsReferentiel
          )
        : undefined;

    const byIds =
      indicateurIds && indicateurIds.length
        ? inArray(indicateurDefinitionTable.id, indicateurIds)
        : undefined;

    const byCollectiviteId = collectiviteId
      ? or(
          eq(indicateurDefinitionTable.collectiviteId, collectiviteId),
          isNull(indicateurDefinitionTable.collectiviteId)
        )
      : undefined;

    const conditions: (SQLWrapper | undefined)[] = [
      byIdentifiantReferentiels,
      byIds,
      byCollectiviteId,
    ];

    const definitions = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurDefinitionTable),
        ...indicateurDefinitionPeriodiciteSelection,
      })
      .from(indicateurDefinitionTable)
      .where(and(...conditions));

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions;
  }
}
