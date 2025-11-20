import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { IndicateurDefinition } from '@tet/domain/indicateurs';
import {
  and,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  SQLWrapper,
} from 'drizzle-orm';

@Injectable()
export class ListDefinitionsLightRepository {
  private readonly logger = new Logger(ListDefinitionsLightRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listDefinitionsLight({
    identifiantsReferentiel,
    indicateurIds,
  }: {
    identifiantsReferentiel?: string[];
    indicateurIds?: number[];
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

    const conditions: (SQLWrapper | undefined)[] = [
      isNotNull(indicateurDefinitionTable.identifiantReferentiel),
      isNull(indicateurDefinitionTable.collectiviteId),
      byIdentifiantReferentiels,
      byIds,
    ];

    const definitions = await this.databaseService.db
      .select({ ...getTableColumns(indicateurDefinitionTable) })
      .from(indicateurDefinitionTable)
      .where(and(...conditions));

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions;
  }
}
