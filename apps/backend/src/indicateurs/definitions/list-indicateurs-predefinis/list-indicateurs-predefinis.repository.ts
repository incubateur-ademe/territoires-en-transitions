import { indicateurSelection } from '../indicateur.column';
import { indicateurCollectiviteTable } from '../indicateur-collectivite.table';
import type { PcaetDiagnosticIndicateurDefinition } from '@tet/domain/demarches';
import { Injectable, Logger } from '@nestjs/common';
import { categorieTagTable } from '@tet/backend/collectivites/tags/categorie-tag.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { thematiqueTable } from '@tet/backend/shared/thematiques/thematique.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { Result } from '@tet/backend/utils/result.type';
import { Tag } from '@tet/domain/collectivites';
import type { IndicateurPredefini } from '@tet/domain/indicateurs';
import {
  and,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  SQL,
  SQLWrapper,
} from 'drizzle-orm';
import { indicateurThematiqueTable } from '../../shared/models/indicateur-thematique.table';
import { validatePredefinis } from '../indicateur.adapter';
import { indicateurActionTable } from '../indicateur-action.table';
import { indicateurCategorieTagTable } from '../indicateur-categorie-tag.table';

@Injectable()
export class ListIndicateursPredefinisRepository {
  private readonly logger = new Logger(
    ListIndicateursPredefinisRepository.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

  async listIndicateursPredefinis(
    {
      identifiantsReferentiel,
      indicateurIds,
    }: {
      identifiantsReferentiel?: string[];
      indicateurIds?: number[];
    } = {},
    tx?: Transaction
  ): Promise<Result<IndicateurPredefini[], 'DATABASE_ERROR'>> {
    const conditions = this.getQueryConditions({
      identifiantsReferentiel,
      indicateurIds,
    });

    const definitions = await (tx ?? this.databaseService.db)
      .select({
        ...indicateurSelection,
      })
      .from(indicateurDefinitionTable)
      .where(and(...conditions));

    this.logger.log(`${definitions.length} définitions trouvées`);

    return validatePredefinis(definitions);
  }

  async listIndicateursPredefinisForCollectivite(
    {
      identifiantsReferentiel,
      indicateurIds,
      collectiviteId,
    }: {
      identifiantsReferentiel?: string[];
      indicateurIds?: number[];
      collectiviteId: number;
    },
    tx?: Transaction
  ): Promise<Result<PcaetDiagnosticIndicateurDefinition[], 'DATABASE_ERROR'>> {
    const conditions = this.getQueryConditions({
      identifiantsReferentiel,
      indicateurIds,
    });

    const definitions = await (tx ?? this.databaseService.db)
      .select({
        ...indicateurSelection,

        // Sans ligne dans `indicateur_collectivite`, le LEFT JOIN rend `null` :
        // un indicateur dont la collectivité n'a rien dit est applicable.
        isApplicable: sql<boolean>`coalesce(${indicateurCollectiviteTable.isApplicable}, true)`,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        indicateurCollectiviteTable,
        and(
          eq(
            indicateurCollectiviteTable.indicateurId,
            indicateurDefinitionTable.id
          ),
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId)
        )
      )
      .where(and(...conditions));

    this.logger.log(
      `${definitions.length} définitions trouvées pour la collectivité ${collectiviteId}`
    );

    return validatePredefinis(definitions);
  }

  async listIndicateursPredefinisAggregates(
    {
      identifiantsReferentiel,
      indicateurIds,
    }: {
      identifiantsReferentiel?: string[];
      indicateurIds?: number[];
    } = {},
    tx?: Transaction
  ): Promise<Result<IndicateurPredefini[], 'DATABASE_ERROR'>> {
    const conditions = this.getQueryConditions({
      identifiantsReferentiel,
      indicateurIds,
    });

    const categoriesSubQuery = this.getCategoriesSubQuery();
    const thematiquesSubQuery = this.getThematiquesSubQuery();
    const mesuresSubQuery = this.getMesuresSubQuery();

    const definitions = await (tx ?? this.databaseService.db)
      .select({
        ...indicateurSelection,

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

    return validatePredefinis(definitions);
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

  async listIndicateursPredefinisHavingComputedValue(
    { identifiantsReferentiel }: { identifiantsReferentiel?: string[] } = {},
    tx?: Transaction
  ): Promise<Result<IndicateurPredefini[], 'DATABASE_ERROR'>> {
    const sourceIndicateurSqlConditions: (SQLWrapper | SQL)[] =
      identifiantsReferentiel?.map((identifiant) =>
        ilike(indicateurDefinitionTable.valeurCalcule, `%${identifiant}%`)
      ) ?? [];

    const sqlConditions: (SQLWrapper | SQL)[] = [
      isNotNull(indicateurDefinitionTable.valeurCalcule),
      isNotNull(indicateurDefinitionTable.identifiantReferentiel),
      isNull(indicateurDefinitionTable.collectiviteId),
    ];
    if (sourceIndicateurSqlConditions.length) {
      sqlConditions.push(or(...sourceIndicateurSqlConditions) as SQLWrapper);
    }

    const computedIndicateurDefinitions = await (tx ?? this.databaseService.db)
      .select({
        ...indicateurSelection,
      })
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

    return validatePredefinis(computedIndicateurDefinitions);
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
