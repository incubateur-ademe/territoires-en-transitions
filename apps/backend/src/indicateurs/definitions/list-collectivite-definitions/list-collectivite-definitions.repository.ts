import { Injectable, Logger } from '@nestjs/common';
import { groupementCollectiviteTable } from '@tet/backend/collectivites/shared/models/groupement-collectivite.table';
import { groupementTable } from '@tet/backend/collectivites/shared/models/groupement.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurGroupeTable } from '@tet/backend/indicateurs/shared/models/indicateur-groupe.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  IndicateurDefinition,
  IndicateurDefinitionAvecEnfants,
} from '@tet/domain/indicateurs';
import {
  aliasedTable,
  and,
  eq,
  getTableColumns,
  inArray,
  isNull,
  or,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
import { objectToCamel } from 'ts-case-convert';

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
      .select()
      .from(indicateurDefinitionTable)
      .where(and(...conditions));

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions;
  }

  /**
   * Charge la définition des indicateurs à partir de leur id
   * ainsi que les définitions des indicateurs "enfant" associés.
   * (utilisé pour l'export)
   */
  async listCollectiviteDefinitionsAvecEnfants({
    collectiviteId,
    indicateurIds,
  }: {
    collectiviteId: number;
    indicateurIds: number[];
  }): Promise<IndicateurDefinitionAvecEnfants[]> {
    this.logger.log(
      `Charge la définition des indicateurs ${indicateurIds.join(',')}`
    );

    const definitionEnfantsTable = aliasedTable(
      indicateurDefinitionTable,
      'enfants'
    );

    const definitions = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurDefinitionTable),
        enfants: sql`json_agg(${definitionEnfantsTable})`,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        indicateurGroupeTable,
        eq(indicateurGroupeTable.parent, indicateurDefinitionTable.id)
      )
      .leftJoin(
        definitionEnfantsTable,
        eq(definitionEnfantsTable.id, indicateurGroupeTable.enfant)
      )
      .leftJoin(
        groupementTable,
        eq(groupementTable.id, definitionEnfantsTable.groupementId)
      )
      .leftJoin(
        groupementCollectiviteTable,
        eq(groupementCollectiviteTable.groupementId, groupementTable.id)
      )
      .where(
        and(
          inArray(indicateurDefinitionTable.id, indicateurIds),
          or(
            isNull(definitionEnfantsTable.groupementId),
            eq(groupementCollectiviteTable.collectiviteId, collectiviteId)
          )
        )
      )
      .groupBy(indicateurDefinitionTable.id);

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions.map(
      (def: IndicateurDefinition & { enfants: unknown[] }) => {
        const enfants = def.enfants?.filter(Boolean);
        return {
          ...def,
          enfants: enfants?.length
            ? (objectToCamel(enfants) as IndicateurDefinition[])
            : null,
        };
      }
    );
  }
}
