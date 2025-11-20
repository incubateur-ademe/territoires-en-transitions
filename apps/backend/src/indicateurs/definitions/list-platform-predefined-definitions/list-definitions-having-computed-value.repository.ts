import { Injectable, Logger } from '@nestjs/common';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type { IndicateurDefinition } from '@tet/domain/indicateurs';
import {
  and,
  isNotNull,
  like,
  or,
  type SQL,
  type SQLWrapper,
} from 'drizzle-orm';

@Injectable()
export class ListDefinitionsHavingComputedValueRepository {
  private readonly logger = new Logger(
    ListDefinitionsHavingComputedValueRepository.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

  async listDefinitionsHavingComputedValue({
    identifiantReferentiels,
  }: { identifiantReferentiels?: string[] } = {}): Promise<
    IndicateurDefinition[]
  > {
    const sourceIndicateurSqlConditions: (SQLWrapper | SQL)[] =
      identifiantReferentiels?.map((identifiant) =>
        like(indicateurDefinitionTable.valeurCalcule, `%${identifiant}%`)
      ) ?? [];

    const sqlConditions: (SQLWrapper | SQL)[] = [
      isNotNull(indicateurDefinitionTable.valeurCalcule),
    ];
    if (sourceIndicateurSqlConditions.length) {
      sqlConditions.push(or(...sourceIndicateurSqlConditions) as SQLWrapper);
    }

    const computedIndicateurDefinitions = await this.databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(and(...sqlConditions));

    this.logger.log(
      `Found ${
        computedIndicateurDefinitions.length
      } computed indicateur definitions: ${computedIndicateurDefinitions
        .map(
          (def) =>
            `${def.identifiantReferentiel || `${def.id}`} (formula: ${
              def.valeurCalcule
            })`
        )
        .join(',')} for source indicateurs: ${
        identifiantReferentiels?.join(',') || 'all'
      }`
    );

    return computedIndicateurDefinitions;
  }
}
