import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurDefinitionPeriodiciteSelection } from '@tet/backend/indicateurs/definitions/indicateur-periodicite.sql';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { IndicateurDefinition } from '@tet/domain/indicateurs';
import {
  and,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  or,
  SQLWrapper,
} from 'drizzle-orm';
import { indicateurCollectiviteTable } from '../indicateur-collectivite.table';
import { indicateurCollectivitePeriodiciteSelection } from '../indicateur-periodicite.sql';

@Injectable()
export class ListCollectiviteDefinitionsRepository {
  private readonly logger = new Logger(
    ListCollectiviteDefinitionsRepository.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

  async listCollectiviteDefinitions(
    {
      identifiantsReferentiel,
      indicateurIds,
      collectiviteId,
    }: {
      identifiantsReferentiel?: string[];
      indicateurIds?: number[];
      collectiviteId?: number;
    } = {},
    tx?: Transaction
  ): Promise<IndicateurDefinition[]> {
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
          isNull(indicateurDefinitionTable.collectiviteId),
          // Un indicateur de groupement est une restriction d'applicabilité,
          // pas une définition personnalisée confidentielle. Le groupement
          // reste donc prioritaire si des données historiques portent les
          // deux colonnes de périmètre.
          isNotNull(indicateurDefinitionTable.groupementId)
        )
      : undefined;

    const conditions: (SQLWrapper | undefined)[] = [
      byIdentifiantReferentiels,
      byIds,
      byCollectiviteId,
    ];

    const definitions = await (tx ?? this.databaseService.db)
      .select({
        ...getTableColumns(indicateurDefinitionTable),
        ...indicateurDefinitionPeriodiciteSelection,
        ...indicateurCollectivitePeriodiciteSelection,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        indicateurCollectiviteTable,
        and(
          eq(
            indicateurCollectiviteTable.indicateurId,
            indicateurDefinitionTable.id
          ),
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId ?? 0)
        )
      )
      .where(and(...conditions));

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions;
  }
}
