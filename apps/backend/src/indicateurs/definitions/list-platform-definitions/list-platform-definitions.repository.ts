import { Injectable, Logger } from '@nestjs/common';
import { categorieTagTable } from '@tet/backend/collectivites/tags/categorie-tag.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Tag } from '@tet/domain/collectivites';
import type { IndicateurDefinition } from '@tet/domain/indicateurs';
import {
  and,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  like,
  or,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { indicateurThematiqueTable } from '../../shared/models/indicateur-thematique.table';
import { indicateurActionTable } from '../indicateur-action.table';
import { indicateurCategorieTagTable } from '../indicateur-categorie-tag.table';

@Injectable()
export class ListPlatformDefinitionsRepository {
  private readonly logger = new Logger(ListPlatformDefinitionsRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listPlatformDefinitions({
    identifiantsReferentiel,
    indicateurIds,
  }: {
    identifiantsReferentiel?: string[];
    indicateurIds?: number[];
  } = {}): Promise<IndicateurDefinition[]> {
    const conditions = this.getQueryConditions({
      identifiantsReferentiel,
      indicateurIds,
    });

    const definitions = await this.databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(and(...conditions));

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions;
  }

  async listPlatformDefinitionAggregates({
    identifiantsReferentiel,
    indicateurIds,
  }: {
    identifiantsReferentiel?: string[];
    indicateurIds?: number[];
  } = {}): Promise<IndicateurDefinition[]> {
    const conditions = this.getQueryConditions({
      identifiantsReferentiel,
      indicateurIds,
    });

    const categoriesSubQuery = this.getCategoriesSubQuery();
    const thematiquesSubQuery = this.getThematiquesSubQuery();
    const mesuresSubQuery = this.getMesuresSubQuery();

    const definitions = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurDefinitionTable),

        categories: sql<
          Tag[]
        >`COALESCE(${categoriesSubQuery.categories}, '{}')`,

        thematiques: sql<
          Tag[]
        >`COALESCE(${thematiquesSubQuery.thematiques}, '{}')`,

        mesures: sql<
          { id: string; nom: string }[]
        >`COALESCE(${mesuresSubQuery.mesures}, '{}')`,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        categoriesSubQuery,
        eq(categoriesSubQuery.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        thematiquesSubQuery,
        eq(thematiquesSubQuery.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        mesuresSubQuery,
        eq(mesuresSubQuery.indicateurId, indicateurDefinitionTable.id)
      )
      .where(and(...conditions));

    this.logger.log(`${definitions.length} définitions trouvées`);

    return definitions;
  }

  private getQueryConditions({
    identifiantsReferentiel,
    indicateurIds,
  }: {
    identifiantsReferentiel?: string[];
    indicateurIds?: number[];
  }): (SQLWrapper | undefined)[] {
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

    return conditions;
  }

  async listPlatformDefinitionsHavingComputedValue({
    identifiantsReferentiel,
  }: { identifiantsReferentiel?: string[] } = {}): Promise<
    IndicateurDefinition[]
  > {
    const sourceIndicateurSqlConditions: (SQLWrapper | SQL)[] =
      identifiantsReferentiel?.map((identifiant) =>
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
        identifiantsReferentiel?.join(',') || 'all'
      }`
    );

    return computedIndicateurDefinitions;
  }

  /** Donne les id des indicateurs à partir de leur identifiant référentiel */
  // TODO Use listPlatformDefinitions instead
  async listPlatformDefinitionIdsByIdentifiantReferentiels(
    identifiantsReferentiel: string[]
  ): Promise<Record<string, number>> {
    this.logger.log(
      `Récupération des id des indicateurs ${identifiantsReferentiel?.join(
        ','
      )}`
    );

    if (!identifiantsReferentiel?.length) {
      return {};
    }

    const definitions = await this.databaseService.db
      .select({
        id: indicateurDefinitionTable.id,
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
      })
      .from(indicateurDefinitionTable)
      .where(
        and(
          isNotNull(indicateurDefinitionTable.identifiantReferentiel),
          isNull(indicateurDefinitionTable.collectiviteId),
          inArray(
            indicateurDefinitionTable.identifiantReferentiel,
            identifiantsReferentiel
          )
        )
      )
      .orderBy(indicateurDefinitionTable.identifiantReferentiel);

    this.logger.log(`${definitions.length} définitions trouvées`);

    const indicateurIdParIdentifiant = Object.fromEntries(
      definitions.map(({ id, identifiant }) => [identifiant, id])
    );

    return indicateurIdParIdentifiant;
  }

  getCategoriesSubQuery() {
    return this.databaseService.db
      .select({
        indicateurId: indicateurCategorieTagTable.indicateurId,
        categories: sql<
          Tag[]
        >`array_agg(json_build_object('id', ${indicateurCategorieTagTable.categorieTagId}, 'nom', ${categorieTagTable.nom} ))`.as(
          'categories'
        ),
      })
      .from(indicateurCategorieTagTable)
      .leftJoin(
        categorieTagTable,
        and(
          eq(categorieTagTable.id, indicateurCategorieTagTable.categorieTagId),
          isNull(categorieTagTable.collectiviteId),
          isNull(categorieTagTable.groupementId)
        )
      )
      .groupBy(indicateurCategorieTagTable.indicateurId)
      .as('indicateurCategories');
  }

  getThematiquesSubQuery() {
    return this.databaseService.db
      .select({
        indicateurId: indicateurThematiqueTable.indicateurId,
        thematiques: sql<
          Tag[]
        >`array_agg(json_build_object('id', ${indicateurThematiqueTable.thematiqueId}, 'nom', ${thematiqueTable.nom} ))`.as(
          'thematiques'
        ),
        thematiqueIds: sql<
          number[]
        >`array_agg(${indicateurThematiqueTable.thematiqueId})`.as(
          'thematique_ids'
        ),
      })
      .from(indicateurThematiqueTable)
      .leftJoin(
        thematiqueTable,
        eq(thematiqueTable.id, indicateurThematiqueTable.thematiqueId)
      )
      .groupBy(indicateurThematiqueTable.indicateurId)
      .as('indicateurThematiques');
  }

  getMesuresSubQuery() {
    return this.databaseService.db
      .select({
        indicateurId: indicateurActionTable.indicateurId,
        mesures: sql<
          { id: string; nom: string }[]
        >`array_agg(json_build_object('id', ${indicateurActionTable.actionId}, 'nom', ${actionDefinitionTable.nom} ))`.as(
          'actions'
        ),
        mesureIds: sql<
          string[]
        >`array_agg(${indicateurActionTable.actionId})`.as('mesure_ids'),
      })
      .from(indicateurActionTable)
      .leftJoin(
        actionDefinitionTable,
        eq(actionDefinitionTable.actionId, indicateurActionTable.actionId)
      )
      .groupBy(indicateurActionTable.indicateurId)
      .as('indicateurMesureIds');
  }
}
