import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { categorieTagTable } from '@/backend/collectivites/tags/categorie-tag.table';
import {
  IndicateurDefinitionDetaillee,
  ListDefinitionsResponse,
} from '@/backend/indicateurs/list-definitions/list-definitions.response';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { indicateurSourceMetadonneeTable } from '@/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurValeurTable } from '@/backend/indicateurs/shared/models/indicateur-valeur.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { thematiqueTable } from '@/backend/shared/thematiques/thematique.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import { Injectable, Logger } from '@nestjs/common';
import assert from 'assert';
import {
  aliasedTable,
  and,
  arrayContains,
  arrayOverlaps,
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
import { omit } from 'es-toolkit';
import { objectToCamel } from 'ts-case-convert';
import { groupementCollectiviteTable } from '../../collectivites/shared/models/groupement-collectivite.table';
import { groupementTable } from '../../collectivites/shared/models/groupement.table';
import { actionDefinitionTable } from '../../referentiels/models/action-definition.table';
import { PermissionService } from '../../users/authorizations/permission.service';
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

  public readonly SECTEUR_CATEGORIE_PREFIX = 'secteur:';
  public readonly SOUS_SECTEUR_CATEGORIE_PREFIX = 'sous-secteur:';

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

  private getIndicateurDefinitionFichesQuery() {
    return this.databaseService.db
      .select({
        indicateurId: ficheActionIndicateurTable.indicateurId,
        ficheActionIds: sql<
          string[]
        >`array_agg(${ficheActionIndicateurTable.ficheId})`.as(
          'fiche_action_ids'
        ),
        ficheActions: sql<
          { id: string; titre: string }[]
        >`array_agg(json_build_object('id', ${ficheActionIndicateurTable.ficheId}, 'titre', ${ficheActionTable.titre} ))`.as(
          'fiche_actions'
        ),
      })
      .from(ficheActionIndicateurTable)
      .leftJoin(
        ficheActionTable,
        eq(ficheActionTable.id, ficheActionIndicateurTable.ficheId)
      )
      .groupBy(ficheActionIndicateurTable.indicateurId)
      .as('indicateurFicheIds');
  }

  private getIndicateurDefinitionMesuresQuery() {
    return this.databaseService.db
      .select({
        indicateurId: indicateurActionTable.indicateurId,
        mesureIds: sql<
          string[]
        >`array_agg(${indicateurActionTable.actionId})`.as('action_ids'),
        mesures: sql<
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
    const listDefinitions = await this.getDefinitionsDetaillees({
      identifiantsReferentiel,
      page: 1,
      limit: undefined, // No pagination
    });
    this.logger.log(`${listDefinitions.data.length} définitions trouvées`);
    return listDefinitions.data;
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
    user?: AuthUser
  ): Promise<ListDefinitionsResponse> {
    if (user) {
      await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['INDICATEURS.VISITE'],
        input?.collectiviteId
          ? ResourceType.COLLECTIVITE
          : ResourceType.PLATEFORME,
        input?.collectiviteId ?? null
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
    const indicateurMesures = this.getIndicateurDefinitionMesuresQuery();
    const indicateurFicheActions = this.getIndicateurDefinitionFichesQuery();
    const indicateurEnfants = this.getIndicateurDefinitionEnfantsQuery();
    const indicateurParents = this.getIndicateurDefinitionParentsQuery();
    const indicateurOpenData = this.getIndicateurOpenDataQuery(
      input?.collectiviteId
    );
    const groupementCollectivites = this.getGroupementCollectivitesQuery();

    const whereConditions: (SQLWrapper | SQL)[] = [];
    const indicateurIdsConditions: (SQLWrapper | SQL)[] = [];
    if (input?.ficheActionIds?.length) {
      // Vraiment étrange, probable bug de drizzle, on ne peut pas lui donner le tableau directement
      const sqlFicheActionIdsNumberArray = `{${input.ficheActionIds.join(
        ','
      )}}`;
      whereConditions.push(
        arrayOverlaps(
          indicateurFicheActions.ficheActionIds,
          sql`${sqlFicheActionIdsNumberArray}`
        )
      );
    }

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

    if (input?.collectiviteId) {
      const groupementCollectiviteConditions: (SQLWrapper | SQL)[] = [
        and(
          isNull(indicateurDefinitionTable.groupementId),
          isNull(indicateurDefinitionTable.collectiviteId)
        )!,
      ];
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
      whereConditions.push(or(...groupementCollectiviteConditions)!);
    }

    // sélectionne les définitions voulues
    const definitionsRequest = this.databaseService.db
      .select({
        ...omit(getTableColumns(indicateurDefinitionTable), [
          'createdAt',
          'modifiedAt',
        ]),
        createdAt: getISOFormatDateQuery(indicateurDefinitionTable.createdAt),
        modifiedAt: getISOFormatDateQuery(indicateurDefinitionTable.modifiedAt),

        // TODO: to be removed, deprecated and not documented anymore but still used in the app
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
        commentaire: indicateurCollectiviteTable.commentaire,
        confidentiel: indicateurCollectiviteTable.confidentiel,
        favoris: indicateurCollectiviteTable.favoris,
        categories: indicateurCategories.categories,
        thematiques: indicateurThematiques.thematiques,
        groupementCollectivites: groupementCollectivites.collectivites,
        enfants: indicateurEnfants.enfants,
        ficheActions: indicateurFicheActions.ficheActions,
        mesures: indicateurMesures.mesures,
        parents: indicateurParents.parents,
        hasOpenData: sql<boolean>`${indicateurOpenData.hasOpenData} is true`,
        estPerso: sql<boolean>`${indicateurDefinitionTable.identifiantReferentiel} is null`,
        estAgregation: indicateurCategories.estAgregation,
        modifiedBy: sql<{
          id: string;
          prenom: string;
          nom: string;
        } | null>`CASE WHEN ${indicateurDefinitionTable.modifiedBy} IS NULL THEN NULL ELSE json_build_object('id', ${indicateurDefinitionTable.modifiedBy}, 'prenom', ${dcpTable.prenom}, 'nom', ${dcpTable.nom}) END`,
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
      // Mesures du référentiel
      .leftJoin(
        indicateurMesures,
        eq(indicateurMesures.indicateurId, indicateurDefinitionTable.id)
      )
      // Fiche actions
      .leftJoin(
        indicateurFicheActions,
        eq(indicateurFicheActions.indicateurId, indicateurDefinitionTable.id)
      )
      // open data
      .leftJoin(
        indicateurOpenData,
        eq(indicateurOpenData.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        dcpTable,
        eq(dcpTable.userId, indicateurDefinitionTable.modifiedBy)
      )
      .where(and(...whereConditions));

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

  getSecteurName(indicateurDefinition: IndicateurDefinitionDetaillee) {
    const secteur = indicateurDefinition.categories.find((categorie) =>
      categorie.nom.startsWith(this.SECTEUR_CATEGORIE_PREFIX)
    );
    return secteur?.nom?.replace(this.SECTEUR_CATEGORIE_PREFIX, '');
  }

  getSousSecteurName(indicateurDefinition: IndicateurDefinitionDetaillee) {
    const sousSecteur = indicateurDefinition.categories.find((categorie) =>
      categorie.nom.startsWith(this.SOUS_SECTEUR_CATEGORIE_PREFIX)
    );
    return sousSecteur?.nom?.replace(this.SOUS_SECTEUR_CATEGORIE_PREFIX, '');
  }
}
