import {
  AuthUser,
  PermissionOperationEnum,
  ResourceType,
} from '@/backend/auth/index-domain';
import {
  categorieTagTable,
  collectiviteTable,
} from '@/backend/collectivites/index-domain';
import {
  indicateurSourceMetadonneeTable,
  indicateurValeurTable,
  ListDefinitionsResponse,
} from '@/backend/indicateurs/index-domain';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { thematiqueTable } from '@/backend/shared/index-domain';
import { Injectable, Logger } from '@nestjs/common';
import assert from 'assert';
import {
  aliasedTable,
  and,
  arrayContains,
  asc,
  count,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  like,
  or,
  SQL,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
import { objectToCamel } from 'ts-case-convert';
import { PermissionService } from '../../auth/authorizations/permission.service';
import { groupementCollectiviteTable } from '../../collectivites/shared/models/groupement-collectivite.table';
import { groupementTable } from '../../collectivites/shared/models/groupement.table';
import { actionDefinitionTable } from '../../referentiels/models/action-definition.table';
import { DatabaseService } from '../../utils/database/database.service';
import { GetFavorisCountRequest } from '../definitions/get-favoris-count.request';
import { GetPathRequest } from '../definitions/get-path.request';
import { indicateurActionTable } from '../shared/models/indicateur-action.table';
import { indicateurCategorieTagTable } from '../shared/models/indicateur-categorie-tag.table';
import { indicateurCollectiviteTable } from '../shared/models/indicateur-collectivite.table';
import {
  IndicateurDefinition,
  IndicateurDefinitionAvecEnfantsType,
  indicateurDefinitionTable,
} from '../shared/models/indicateur-definition.table';
import { indicateurGroupeTable } from '../shared/models/indicateur-groupe.table';
import { indicateurThematiqueTable } from '../shared/models/indicateur-thematique.table';
import { ListDefinitionsInput } from './list-definitions.input';

@Injectable()
export class ListDefinitionsService {
  private readonly logger = new Logger(ListDefinitionsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  private getIndicateurDefinitionThematiquesQuery() {
    return this.databaseService.db
      .select({
        indicateurId: indicateurThematiqueTable.indicateurId,
        thematiqueIds: sql<
          number[]
        >`array_agg(${indicateurThematiqueTable.thematiqueId})`.as(
          'thematique_ids'
        ),
        thematiqueMids: sql<string[]>`array_agg(${thematiqueTable.mdId})`.as(
          'thematique_mids'
        ),
        thematiques: sql<
          { id: number; nom: string; mdId?: string }[]
        >`array_agg(json_build_object('id', ${indicateurThematiqueTable.thematiqueId}, 'nom', ${thematiqueTable.nom}, 'mdId', ${thematiqueTable.mdId} ))`.as(
          'thematiques'
        ),
        thematiqueNoms: sql<string[]>`array_agg(${thematiqueTable.nom})`.as(
          'thematique_noms'
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

  private getIndicateurDefinitionParentsQuery() {
    const parentDefinition = aliasedTable(
      indicateurDefinitionTable,
      'parentDefinition'
    );

    return this.databaseService.db
      .select({
        indicateurId: indicateurGroupeTable.enfant,
        parentIds: sql<string[]>`array_agg(${indicateurGroupeTable.parent})`.as(
          'parent_ids'
        ),
        parents: sql<
          {
            id: number;
            identifiantReferentiel: string | null;
            titre: string;
            titreCourt: string | null;
          }[]
        >`array_agg(json_build_object('id', ${indicateurGroupeTable.parent}, 'identifiantReferentiel', ${parentDefinition.identifiantReferentiel}, 'titre', ${parentDefinition.titre}, 'titreCourt', ${parentDefinition.titreCourt} ))`.as(
          'parents'
        ),
      })
      .from(indicateurGroupeTable)
      .leftJoin(
        parentDefinition,
        eq(parentDefinition.id, indicateurGroupeTable.parent)
      )
      .groupBy(indicateurGroupeTable.enfant)
      .as('indicateurParents');
  }

  private getIndicateurDefinitionEnfantsQuery() {
    const enfantDefinition = aliasedTable(
      indicateurDefinitionTable,
      'enfantDefinition'
    );

    return this.databaseService.db
      .select({
        indicateurId: indicateurGroupeTable.parent,
        enfantIds: sql<string[]>`array_agg(${indicateurGroupeTable.enfant})`.as(
          'enfant_ids'
        ),
        enfants: sql<
          {
            id: number;
            identifiantReferentiel: string;
            titre: string;
            titreCourt: string | null;
          }[]
        >`array_agg(json_build_object('id', ${indicateurGroupeTable.enfant}, 'identifiantReferentiel', ${enfantDefinition.identifiantReferentiel}, 'titre', ${enfantDefinition.titre}, 'titreCourt', ${enfantDefinition.titreCourt} ))`.as(
          'enfants'
        ),
      })
      .from(indicateurGroupeTable)
      .leftJoin(
        enfantDefinition,
        eq(enfantDefinition.id, indicateurGroupeTable.enfant)
      )
      .groupBy(indicateurGroupeTable.parent)
      .as('indicateurEnfants');
  }

  // TODO: create a materialized view for this
  private getIndicateurOpenDataQuery(collectiviteId?: number) {
    return this.databaseService.db
      .select({
        indicateurId: indicateurValeurTable.indicateurId,
        hasOpenData:
          sql<boolean>`bool_or(${indicateurValeurTable.metadonneeId} is not null and ${indicateurSourceMetadonneeTable.sourceId} != 'snbc')`.as(
            'open_data'
          ),
      })
      .from(indicateurValeurTable)
      .leftJoin(
        indicateurSourceMetadonneeTable,
        eq(
          indicateurSourceMetadonneeTable.id,
          indicateurValeurTable.metadonneeId
        )
      )
      .where(
        collectiviteId
          ? eq(indicateurValeurTable.collectiviteId, collectiviteId)
          : sql`true`
      )
      .groupBy(indicateurValeurTable.indicateurId)
      .as('indicateurOpenData');
  }

  private getIndicateurDefinitionActionIdsQuery() {
    return this.databaseService.db
      .select({
        indicateurId: indicateurActionTable.indicateurId,
        actionIds: sql<
          string[]
        >`array_agg(${indicateurActionTable.actionId})`.as('action_ids'),
        actions: sql<
          { id: string; nom: string }[]
        >`array_agg(json_build_object('id', ${indicateurActionTable.actionId}, 'nom', ${actionDefinitionTable.nom} ))`.as(
          'actions'
        ),
      })
      .from(indicateurActionTable)
      .leftJoin(
        actionDefinitionTable,
        eq(actionDefinitionTable.actionId, indicateurActionTable.actionId)
      )
      .groupBy(indicateurActionTable.indicateurId)
      .as('indicateurActionIds');
  }

  private getGroupementCollectivitesQuery() {
    return this.databaseService.db
      .select({
        groupementId: groupementCollectiviteTable.groupementId,
        collectivites: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${groupementCollectiviteTable.collectiviteId}, 'nom', ${collectiviteTable.nom}, 'type', ${collectiviteTable.type}, 'siren', ${collectiviteTable.siren} ))`.as(
          'collectivites'
        ),
        collectiviteIds: sql<
          number[]
        >`array_agg(${groupementCollectiviteTable.collectiviteId})`.as(
          'collectivite_ids'
        ),
      })
      .from(groupementCollectiviteTable)
      .leftJoin(
        collectiviteTable,
        eq(collectiviteTable.id, groupementCollectiviteTable.collectiviteId)
      )
      .groupBy(groupementCollectiviteTable.groupementId)
      .as('groupementCollectivites');
  }

  private getIndicateurDefinitionCategoriesQuery(collectiviteId?: number) {
    return this.databaseService.db
      .select({
        indicateurId: indicateurCategorieTagTable.indicateurId,
        categorieIds: sql<
          number[]
        >`array_agg(${indicateurCategorieTagTable.categorieTagId})`.as(
          'categorie_ids'
        ),
        categories: sql<
          { id: number; nom: string }[]
        >`array_agg(json_build_object('id', ${indicateurCategorieTagTable.categorieTagId}, 'nom', ${categorieTagTable.nom} ))`.as(
          'categories'
        ),
        categorieNoms: sql<number[]>`array_agg(${categorieTagTable.nom})`.as(
          'categorie_noms'
        ),
        // TODO: a bit weird to use a categorie tag to determine if the indicator is an aggregation
        estAgregation:
          sql<boolean>`bool_or(${categorieTagTable.nom} = 'agregation')`.as(
            'est_agregation'
          ),
      })
      .from(indicateurCategorieTagTable)
      .leftJoin(
        categorieTagTable,
        and(
          eq(categorieTagTable.id, indicateurCategorieTagTable.categorieTagId),
          or(
            isNull(categorieTagTable.collectiviteId),
            collectiviteId
              ? eq(categorieTagTable.collectiviteId, collectiviteId)
              : undefined
          )
        )
      )
      .groupBy(indicateurCategorieTagTable.indicateurId)
      .as('indicateurCategories');
  }

  async getReferentielIndicateurDefinitions(
    identifiantsReferentiel?: string[]
  ) {
    this.logger.log(
      `Récupération des définitions des indicateurs ${identifiantsReferentiel?.join(
        ','
      )}`
    );
    const conditions: (SQLWrapper | SQL)[] = [
      isNotNull(indicateurDefinitionTable.identifiantReferentiel),
      isNull(indicateurDefinitionTable.collectiviteId),
    ];
    if (identifiantsReferentiel) {
      conditions.push(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          identifiantsReferentiel
        )
      );
    }

    const indicateurThematiques =
      this.getIndicateurDefinitionThematiquesQuery();
    const indicateurCategories = this.getIndicateurDefinitionCategoriesQuery();
    const indicateurActionIds = this.getIndicateurDefinitionActionIdsQuery();
    const indicateurParents = this.getIndicateurDefinitionParentsQuery();

    const definitions = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurDefinitionTable),
        thematiques: indicateurThematiques.thematiques,
        categories: indicateurCategories.categories,
        actions: indicateurActionIds.actions,
        parents: indicateurParents.parents,
      })
      .from(indicateurDefinitionTable)
      .leftJoin(
        indicateurThematiques,
        eq(indicateurThematiques.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        indicateurCategories,
        eq(indicateurCategories.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        indicateurActionIds,
        eq(indicateurActionIds.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        indicateurParents,
        eq(indicateurParents.indicateurId, indicateurDefinitionTable.id)
      )
      .where(and(...conditions))
      .orderBy(indicateurDefinitionTable.identifiantReferentiel);
    this.logger.log(`${definitions.length} définitions trouvées`);
    return definitions;
  }

  /** Donne les id des indicateurs à partir de leur identifiant référentiel */
  async getIndicateurIdByIdentifiant(identifiantsReferentiel: string[]) {
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
    return indicateurIdParIdentifiant as Record<string, number>;
  }

  /**
   * Charge la définition des indicateurs à partir de leur id
   * ainsi que les définitions des indicateurs "enfant" associés.
   * (utilisé pour l'export)
   */
  async getIndicateurDefinitionsAvecEnfants(
    collectiviteId: number,
    indicateurIds: number[]
  ): Promise<IndicateurDefinitionAvecEnfantsType[]> {
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

  async getIndicateurDefinitions(indicateurIds: number[]) {
    const indicateurDefinitions = await this.databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(inArray(indicateurDefinitionTable.id, indicateurIds));
    return indicateurDefinitions;
  }

  getIndicateurIdToIdentifiant(
    indicateurDefinitions: IndicateurDefinition[]
  ): Record<number, string> {
    return indicateurDefinitions.reduce((acc, def) => {
      if (!def.identifiantReferentiel) {
        return acc;
      } else {
        return { ...acc, [def.id]: def.identifiantReferentiel };
      }
    }, {});
  }

  async getComputedIndicateurDefinitions(
    sourceIndicateurIdentifiants?: string[]
  ): Promise<IndicateurDefinition[]> {
    const sourceIndicateurSqlConditions: (SQLWrapper | SQL)[] | undefined =
      sourceIndicateurIdentifiants?.map((identifiant) =>
        like(indicateurDefinitionTable.valeurCalcule, `%${identifiant}%`)
      );

    const sqlConditions: (SQLWrapper | SQL)[] = [
      isNotNull(indicateurDefinitionTable.valeurCalcule),
    ];
    if (sourceIndicateurSqlConditions) {
      sqlConditions.push(or(...sourceIndicateurSqlConditions)!);
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
        sourceIndicateurIdentifiants?.join(',') || 'all'
      }`
    );

    return computedIndicateurDefinitions;
  }

  /**
   * Renvoi les définitions détaillées d'indicateur à partir de leur id ou de
   * leur identifiant référentiel
   */
  async getDefinitionsDetaillees(
    input: ListDefinitionsInput,
    tokenInfo: AuthUser
  ): Promise<ListDefinitionsResponse> {
    if (input?.collectiviteId) {
      await this.permissionService.isAllowed(
        tokenInfo,
        PermissionOperationEnum['INDICATEURS.VISITE'],
        ResourceType.COLLECTIVITE,
        input.collectiviteId
      );
    } else {
      await this.permissionService.isAllowed(
        tokenInfo,
        PermissionOperationEnum['INDICATEURS.VISITE'],
        ResourceType.PLATEFORME,
        null
      );
    }

    this.logger.log(
      `Lecture des définitions détaillées d'indicateur id ${[
        ...(input?.indicateurIds || []),
        input?.identifiantsReferentiel || [],
      ].join(',')} pour la collectivité ${input?.collectiviteId || 'toutes'}`
    );

    const indicateurThematiques =
      this.getIndicateurDefinitionThematiquesQuery();
    const indicateurCategories = this.getIndicateurDefinitionCategoriesQuery();
    const indicateurActionIds = this.getIndicateurDefinitionActionIdsQuery();
    const indicateurEnfants = this.getIndicateurDefinitionEnfantsQuery();
    const indicateurParents = this.getIndicateurDefinitionParentsQuery();
    const indicateurOpenData = this.getIndicateurOpenDataQuery(
      input?.collectiviteId
    );
    const groupementCollectivites = this.getGroupementCollectivitesQuery();

    const whereConditions: (SQLWrapper | SQL)[] = [];
    const indicateurIdsConditions: (SQLWrapper | SQL)[] = [];
    if (input?.indicateurIds?.length) {
      indicateurIdsConditions.push(
        inArray(indicateurDefinitionTable.id, input?.indicateurIds)
      );
    }
    if (input?.identifiantsReferentiel?.length) {
      indicateurIdsConditions.push(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          input?.identifiantsReferentiel
        )
      );
    }
    if (indicateurIdsConditions.length) {
      whereConditions.push(or(...indicateurIdsConditions)!);
    }
    const groupementCollectiviteConditions: (SQLWrapper | SQL)[] = [
      and(
        isNull(indicateurDefinitionTable.groupementId),
        isNull(indicateurDefinitionTable.collectiviteId)
      )!,
    ];
    if (input?.collectiviteId) {
      const sqlNumberArray = `{${input.collectiviteId}}`;
      groupementCollectiviteConditions.push(
        arrayContains(
          groupementCollectivites.collectiviteIds,
          sql`${sqlNumberArray}`
        )
      );
      groupementCollectiviteConditions.push(
        eq(indicateurDefinitionTable.collectiviteId, input.collectiviteId)
      );
    }

    whereConditions.push(or(...groupementCollectiviteConditions)!);

    // sélectionne les définitions voulues
    const definitionsRequest = this.databaseService.db
      .select({
        ...getTableColumns(indicateurDefinitionTable),
        // TODO: to be removed, deprecated and not documented anymore but still used in the app
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
        commentaire: indicateurCollectiviteTable.commentaire,
        confidentiel: indicateurCollectiviteTable.confidentiel,
        favoris: indicateurCollectiviteTable.favoris,
        categories: indicateurCategories.categories,
        thematiques: indicateurThematiques.thematiques,
        groupementCollectivites: groupementCollectivites.collectivites,
        enfants: indicateurEnfants.enfants,
        mesures: indicateurActionIds.actions,
        parents: indicateurParents.parents,
        hasOpenData: sql<boolean>`${indicateurOpenData.hasOpenData} is true`,
        estPerso: sql<boolean>`${indicateurDefinitionTable.identifiantReferentiel} is null`,
        estAgregation: indicateurCategories.estAgregation,
      })
      .from(indicateurDefinitionTable)
      // infos complémentaires sur l'indicateur pour la collectivité
      .leftJoin(
        indicateurCollectiviteTable,
        and(
          eq(
            indicateurCollectiviteTable.indicateurId,
            indicateurDefinitionTable.id
          ),
          eq(
            indicateurCollectiviteTable.collectiviteId,
            input?.collectiviteId || 0 // We don't want to have a join
          )
        )
      )
      // enfants
      .leftJoin(
        indicateurEnfants,
        eq(indicateurEnfants.indicateurId, indicateurDefinitionTable.id)
      )
      // parents
      .leftJoin(
        indicateurParents,
        eq(indicateurParents.indicateurId, indicateurDefinitionTable.id)
      )
      // catégories
      .leftJoin(
        indicateurCategories,
        eq(indicateurCategories.indicateurId, indicateurDefinitionTable.id)
      )
      // thématiques
      .leftJoin(
        indicateurThematiques,
        eq(indicateurThematiques.indicateurId, indicateurDefinitionTable.id)
      )
      // définitions liées aux groupements de la collectivité
      .leftJoin(
        groupementTable,
        eq(groupementTable.id, indicateurDefinitionTable.groupementId)
      )
      .leftJoin(
        groupementCollectivites,
        eq(
          groupementCollectivites.groupementId,
          indicateurDefinitionTable.groupementId
        )
      )
      // actions du référentiel
      .leftJoin(
        indicateurActionIds,
        eq(indicateurActionIds.indicateurId, indicateurDefinitionTable.id)
      )
      // open data
      .leftJoin(
        indicateurOpenData,
        eq(indicateurOpenData.indicateurId, indicateurDefinitionTable.id)
      )
      .where(and(...whereConditions));

    this.logger.log(definitionsRequest.toSQL());

    const definitionsResult = await this.databaseService.withPagination(
      definitionsRequest.$dynamic(),
      asc(indicateurDefinitionTable.identifiantReferentiel),
      input?.page || 1,
      input?.limit
    );

    this.logger.log(`${definitionsResult.data.length} définitions trouvées`);

    return definitionsResult;
  }

  /**
   * Donne le chemin d'un indicateur à partir de son id
   */
  async getPath(data: GetPathRequest, tokenInfo: AuthUser) {
    const { collectiviteId, indicateurId } = data;
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.VISITE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Lecture du chemin de l'indicateur id ${indicateurId} pour la collectivité ${collectiviteId}`
    );

    // TODO: à changer quand `with recursive` sera supporté
    // ref: https://github.com/drizzle-team/drizzle-orm/issues/209
    const chemins = await this.databaseService.db.execute<{
      id: number;
      chemin: { id: number; identifiant?: string; titre: string }[];
    }>(sql`
          with recursive chemin_indicateur (id, identifiant_referentiel, chemin) as (
            select id,
              identifiant_referentiel,
              array [row_to_json(
                (select r from (select titre, id, identifiant_referentiel as identifiant) r)
              )]::jsonb []
            from indicateur_definition
            where id not in (
                select enfant
                from indicateur_groupe
              )
            union
            select t1.id,
              t1.identifiant_referentiel,
              array_append(
                t2.chemin,
                jsonb_build_object(
                  'titre',
                  coalesce(t1.titre_court, t1.titre),
                  'id',
                  t1.id,
                  'identifiant',
                  t1.identifiant_referentiel
                )
              )
            from indicateur_definition t1
              inner join indicateur_groupe g on t1.id = g.enfant
              inner join chemin_indicateur t2 on t2.id = g.parent
          )
          select *
          from chemin_indicateur
          where id = ${indicateurId}
        `);

    this.logger.log(`chemin ${chemins.rowCount ? '' : 'non'} trouvé`);

    return chemins.rows[0]?.chemin;
  }

  /** Donne le nombre d'indicateurs favoris de la collectivité */
  async getFavorisCount(data: GetFavorisCountRequest, tokenInfo: AuthUser) {
    const { collectiviteId } = data;
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.VISITE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Lecture du nombre d'indicateurs favoris de la collectivité ${collectiviteId}`
    );

    const rows = await this.databaseService.db
      .select({ value: count(indicateurCollectiviteTable.favoris) })
      .from(indicateurCollectiviteTable)
      .where(
        and(
          eq(indicateurCollectiviteTable.collectiviteId, collectiviteId),
          eq(indicateurCollectiviteTable.favoris, true)
        )
      );
    return rows[0]?.value ?? 0;
  }

  async getPersonnalisesCount(
    data: GetFavorisCountRequest,
    tokenInfo: AuthUser
  ) {
    const { collectiviteId } = data;
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.VISITE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Lecture du nombre d'indicateurs personnalises de la collectivité ${collectiviteId}`
    );

    const rows = await this.databaseService.db
      .select({ count: count() })
      .from(indicateurDefinitionTable)
      .where(eq(indicateurDefinitionTable.collectiviteId, collectiviteId));
    return rows[0]?.count ?? 0;
  }

  /** Donne le nombre d'indicateurs dont l'utilisateur est pilote */
  async getMesIndicateursCount(
    data: GetFavorisCountRequest,
    tokenInfo: AuthUser
  ) {
    assert(tokenInfo.id, 'Id utilisateur non valide');
    const { collectiviteId } = data;
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperationEnum['INDICATEURS.VISITE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Lecture du nombre d'indicateurs dont l'utilisateur ${tokenInfo.id} est pilote pour la collectivité ${collectiviteId}`
    );

    const rows = await this.databaseService.db
      .select({ value: count(indicateurDefinitionTable.id) })
      .from(indicateurPiloteTable)
      .leftJoin(
        indicateurDefinitionTable,
        eq(indicateurDefinitionTable.id, indicateurPiloteTable.indicateurId)
      )
      .where(
        and(
          eq(indicateurPiloteTable.userId, tokenInfo.id),
          eq(indicateurPiloteTable.collectiviteId, collectiviteId),
          or(
            eq(indicateurDefinitionTable.collectiviteId, collectiviteId),
            isNull(indicateurDefinitionTable.collectiviteId)
          )
        )
      );
    return rows[0]?.value ?? 0;
  }
}
