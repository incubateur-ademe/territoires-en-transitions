import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { PersonneTagOrUser } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { categorieTagTable } from '@/backend/collectivites/tags/categorie-tag.table';
import { indicateurCollectiviteTable } from '@/backend/indicateurs/definitions/indicateur-collectivite.table';
import { ListDefinitionsOutput } from '@/backend/indicateurs/definitions/list-definitions/list-definitions.response';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { indicateurSourceMetadonneeTable } from '@/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurValeurTable } from '@/backend/indicateurs/shared/models/indicateur-valeur.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { thematiqueTable } from '@/backend/shared/thematiques/thematique.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { sqlAuthorOrNull } from '@/backend/users/models/author.utils';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { Injectable, Logger } from '@nestjs/common';
import assert from 'assert';
import {
  aliasedTable,
  and,
  arrayContains,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
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
import { groupementCollectiviteTable } from '../../../collectivites/shared/models/groupement-collectivite.table';
import { groupementTable } from '../../../collectivites/shared/models/groupement.table';
import { personneTagTable } from '../../../collectivites/tags/personnes/personne-tag.table';
import { serviceTagTable } from '../../../collectivites/tags/service-tag.table';
import { Tag } from '../../../collectivites/tags/tag.table-base';
import { axeTable } from '../../../plans/fiches/shared/models/axe.table';
import { ficheActionAxeTable } from '../../../plans/fiches/shared/models/fiche-action-axe.table';
import { actionDefinitionTable } from '../../../referentiels/models/action-definition.table';
import { PermissionService } from '../../../users/authorizations/permission.service';
import { DatabaseService } from '../../../utils/database/database.service';
import { arrayOverlapsPatched } from '../../../utils/drizzle.utils';
import { indicateurGroupeTable } from '../../shared/models/indicateur-groupe.table';
import { indicateurThematiqueTable } from '../../shared/models/indicateur-thematique.table';
import { indicateurServiceTagTable } from '../handle-definition-services/indicateur-service-tag.table';
import { indicateurActionTable } from '../indicateur-action.table';
import { indicateurCategorieTagTable } from '../indicateur-categorie-tag.table';
import {
  IndicateurDefinition,
  IndicateurDefinitionAvecEnfants,
  indicateurDefinitionTable,
} from '../indicateur-definition.table';
import { GetFavorisCountRequest } from './get-favoris-count.request';
import { GetPathRequest } from './get-path.request';
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

  private getIndicateurDefinitionPilotesQuery() {
    return this.databaseService.db
      .select({
        indicateurId: indicateurPiloteTable.indicateurId,
        pilotes: sql<PersonneTagOrUser[]>`array_agg(
          CASE
            WHEN ${indicateurPiloteTable.id} IS NOT NULL THEN
              json_build_object(
                'nom', CASE
                  WHEN ${indicateurPiloteTable.userId} IS NOT NULL THEN
                    CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})
                  WHEN ${indicateurPiloteTable.tagId} IS NOT NULL THEN
                    ${personneTagTable.nom}
                END,
                'userId', ${indicateurPiloteTable.userId},
                'tagId', ${indicateurPiloteTable.tagId}
              )
          END
        ) FILTER (WHERE ${indicateurPiloteTable.id} IS NOT NULL)`.as('pilotes'),
        utilisateurPiloteIds: sql<
          string[]
        >`array_agg(${indicateurPiloteTable.userId}) FILTER (WHERE ${indicateurPiloteTable.userId} IS NOT NULL)`.as(
          'utilisateur_pilote_ids'
        ),
        personnePiloteIds: sql<
          number[]
        >`array_agg(${indicateurPiloteTable.tagId}) FILTER (WHERE ${indicateurPiloteTable.tagId} IS NOT NULL)`.as(
          'personne_pilote_ids'
        ),
      })
      .from(indicateurPiloteTable)
      .leftJoin(dcpTable, eq(dcpTable.userId, indicateurPiloteTable.userId))
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, indicateurPiloteTable.tagId)
      )
      .groupBy(indicateurPiloteTable.indicateurId)
      .as('indicateurPilotes');
  }

  private getIndicateurDefinitionServicesQuery() {
    return this.databaseService.db
      .select({
        indicateurId: indicateurServiceTagTable.indicateurId,
        services: sql<Tag[]>`array_agg(
          CASE
            WHEN ${indicateurServiceTagTable.serviceTagId} IS NOT NULL THEN
              json_build_object(
                'id', ${indicateurServiceTagTable.serviceTagId},
                'nom', ${serviceTagTable.nom}
              )
          END
        ) FILTER (WHERE ${indicateurServiceTagTable.serviceTagId} IS NOT NULL)`.as(
          'services'
        ),
        serviceIds: sql<
          number[]
        >`array_agg(${indicateurServiceTagTable.serviceTagId}) FILTER (WHERE ${indicateurServiceTagTable.serviceTagId} IS NOT NULL)`.as(
          'service_ids'
        ),
      })
      .from(indicateurServiceTagTable)
      .leftJoin(
        serviceTagTable,
        eq(serviceTagTable.id, indicateurServiceTagTable.serviceTagId)
      )
      .groupBy(indicateurServiceTagTable.indicateurId)
      .as('indicateurServices');
  }

  private getIndicateurDefinitionFichesQuery() {
    return this.databaseService.db
      .select({
        indicateurId: ficheActionIndicateurTable.indicateurId,
        ficheIds: sql<
          number[]
        >`array_agg(${ficheActionIndicateurTable.ficheId})`.as(
          'fiche_action_ids'
        ),
        fiches: sql<
          { id: string; titre: string }[]
        >`array_agg(json_build_object('id', ${ficheActionIndicateurTable.ficheId}, 'titre', ${ficheActionTable.titre} ))`.as(
          'fiches'
        ),
        planIds: sql<
          number[]
        >`array_agg(DISTINCT ${axeTable.id}) FILTER (WHERE ${axeTable.id} IS NOT NULL)`.as(
          'plan_ids'
        ),
      })
      .from(ficheActionIndicateurTable)
      .leftJoin(
        ficheActionTable,
        eq(ficheActionTable.id, ficheActionIndicateurTable.ficheId)
      )
      .leftJoin(
        ficheActionAxeTable,
        eq(ficheActionAxeTable.ficheId, ficheActionIndicateurTable.ficheId)
      )
      .leftJoin(axeTable, eq(axeTable.id, ficheActionAxeTable.axeId))
      .groupBy(ficheActionIndicateurTable.indicateurId)
      .as('indicateurFicheIds');
  }

  private getIndicateurDefinitionMesuresQuery() {
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

  private getIndicateurDefinitionCategoriesQuery({
    collectiviteId,
  }: {
    collectiviteId?: number;
  } = {}) {
    return this.databaseService.db
      .select({
        indicateurId: indicateurCategorieTagTable.indicateurId,
        categories: sql<
          Tag[]
        >`array_agg(json_build_object('id', ${indicateurCategorieTagTable.categorieTagId}, 'nom', ${categorieTagTable.nom} ))`.as(
          'categories'
        ),
        categorieNoms: sql<
          string[]
        >`array_agg(${categorieTagTable.nom}) FILTER (WHERE ${categorieTagTable.nom} IS NOT NULL)`.as(
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
          // eq(categorieTagTable.collectiviteId, collectiviteId!)
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

  /**
   * TODO: use directly listDefinitions
   * @param identifiantsReferentiel
   * @returns
   */
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
    const indicateurMesures = this.getIndicateurDefinitionMesuresQuery();
    const indicateurParents = this.getIndicateurDefinitionParentsQuery();

    const definitions = await this.databaseService.db
      .select({
        ...getTableColumns(indicateurDefinitionTable),
        thematiques: indicateurThematiques.thematiques,
        categories: indicateurCategories.categories,
        mesures: indicateurMesures.mesures,
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
        indicateurMesures,
        eq(indicateurMesures.indicateurId, indicateurDefinitionTable.id)
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
  async listIndicateurDefinitionsAvecEnfants(
    collectiviteId: number,
    indicateurIds: number[]
  ): Promise<IndicateurDefinitionAvecEnfants[]> {
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

  async listIndicateurDefinitions(indicateurIds: number[]) {
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
  async listDefinitions(
    { collectiviteId, filters, queryOptions }: ListDefinitionsInput,
    user: AuthUser
  ): Promise<ListDefinitionsOutput> {
    if (collectiviteId) {
      await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['INDICATEURS.VISITE'],
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    } else {
      await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['INDICATEURS.VISITE'],
        ResourceType.PLATEFORME,
        null
      );
    }

    this.logger.log(
      `Lecture des définitions détaillées d'indicateur id ${[
        ...(filters.indicateurIds || []),
        filters.identifiantsReferentiel || [],
      ].join(',')} pour la collectivité ${collectiviteId || 'toutes'}`
    );

    const indicateurThematiques =
      this.getIndicateurDefinitionThematiquesQuery();
    const indicateurCategories = this.getIndicateurDefinitionCategoriesQuery({
      collectiviteId,
    });
    const indicateurMesures = this.getIndicateurDefinitionMesuresQuery();
    const indicateurFicheActions = this.getIndicateurDefinitionFichesQuery();
    const indicateurEnfants = this.getIndicateurDefinitionEnfantsQuery();
    const indicateurParents = this.getIndicateurDefinitionParentsQuery();
    const indicateurPilotes = this.getIndicateurDefinitionPilotesQuery();
    const indicateurServices = this.getIndicateurDefinitionServicesQuery();
    const indicateurOpenData = this.getIndicateurOpenDataQuery(collectiviteId);
    const groupementCollectivites = this.getGroupementCollectivitesQuery();

    const whereConditions: (SQLWrapper | SQL | undefined)[] = [];
    const indicateurIdsConditions: (SQLWrapper | SQL)[] = [];

    if (filters.ficheIds?.length) {
      whereConditions.push(
        arrayOverlapsPatched(indicateurFicheActions.ficheIds, filters.ficheIds)
      );
    }

    if (filters.indicateurIds?.length) {
      indicateurIdsConditions.push(
        inArray(indicateurDefinitionTable.id, filters.indicateurIds)
      );
    }
    if (filters.identifiantsReferentiel?.length) {
      indicateurIdsConditions.push(
        inArray(
          indicateurDefinitionTable.identifiantReferentiel,
          filters.identifiantsReferentiel
        )
      );
    }
    if (indicateurIdsConditions.length) {
      whereConditions.push(or(...indicateurIdsConditions));
    }

    if (collectiviteId) {
      const groupementCollectiviteConditions = [
        and(
          isNull(indicateurDefinitionTable.groupementId),
          isNull(indicateurDefinitionTable.collectiviteId)
        ),
      ];
      const sqlNumberArray = `{${collectiviteId}}`;
      groupementCollectiviteConditions.push(
        arrayContains(
          groupementCollectivites.collectiviteIds,
          sql`${sqlNumberArray}`
        )
      );
      groupementCollectiviteConditions.push(
        eq(indicateurDefinitionTable.collectiviteId, collectiviteId)
      );
      whereConditions.push(or(...groupementCollectiviteConditions));
    }

    // Additional filters to support the old endpoint functionality
    if (filters.thematiqueIds?.length) {
      whereConditions.push(
        arrayOverlapsPatched(
          indicateurThematiques.thematiqueIds,
          filters.thematiqueIds
        )
      );
    }

    if (filters.utilisateurPiloteIds?.length) {
      whereConditions.push(
        arrayOverlapsPatched(
          indicateurPilotes.utilisateurPiloteIds,
          filters.utilisateurPiloteIds,
          { cast: 'uuid' }
        )
      );
    }

    if (filters.personnePiloteIds?.length) {
      whereConditions.push(
        arrayOverlapsPatched(
          indicateurPilotes.personnePiloteIds,
          filters.personnePiloteIds
        )
      );
    }

    if (filters.serviceIds?.length) {
      whereConditions.push(
        arrayOverlapsPatched(indicateurServices.serviceIds, filters.serviceIds)
      );
    }

    if (filters.planIds?.length) {
      whereConditions.push(
        arrayOverlapsPatched(indicateurFicheActions.planIds, filters.planIds)
      );
    }

    if (filters.mesureId) {
      whereConditions.push(
        arrayOverlapsPatched(indicateurMesures.mesureIds, [filters.mesureId])
      );
    }

    if (filters.categorieNoms?.length) {
      whereConditions.push(
        arrayOverlapsPatched(
          indicateurCategories.categorieNoms,
          filters.categorieNoms
        )
      );
    }

    if (filters.participationScore !== undefined) {
      whereConditions.push(
        eq(
          indicateurDefinitionTable.participationScore,
          filters.participationScore
        )
      );
    }

    // TODO: Implement estComplet filter based on whether there are user values
    // This would require joining with indicateur_valeur table
    // if (input?.estComplet !== undefined) {
    //   whereConditions.push(
    //     eq(indicateurDefinitionTable.estComplet, input.estComplet)
    //   );
    // }

    if (filters.estConfidentiel !== undefined) {
      whereConditions.push(
        eq(indicateurCollectiviteTable.confidentiel, filters.estConfidentiel)
      );
    }

    if (filters.estFavori !== undefined) {
      whereConditions.push(
        eq(indicateurCollectiviteTable.favoris, filters.estFavori)
      );
    }

    if (filters.fichesNonClassees !== undefined) {
      whereConditions.push(
        filters.fichesNonClassees
          ? isNull(indicateurFicheActions.fiches)
          : isNotNull(indicateurFicheActions.fiches)
      );
    }

    if (filters.estPerso !== undefined) {
      whereConditions.push(
        filters.estPerso
          ? isNull(indicateurDefinitionTable.identifiantReferentiel)
          : isNotNull(indicateurDefinitionTable.identifiantReferentiel)
      );
    }

    if (filters.hasOpenData !== undefined) {
      whereConditions.push(
        eq(indicateurOpenData.hasOpenData, filters.hasOpenData)
      );
    }

    if (filters.text) {
      whereConditions.push(
        or(
          ilike(indicateurDefinitionTable.titre, `%${filters.text}%`),
          ilike(indicateurDefinitionTable.description, `%${filters.text}%`)
        )
      );
    }

    const definitionsQuery = this.databaseService.db
      .select({
        ...getTableColumns(indicateurDefinitionTable),

        count: sql<number>`(count(*) over())::int`,

        // TODO: to be removed, deprecated and not documented anymore but still used in the app
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
        estPerso: sql<boolean>`${indicateurDefinitionTable.identifiantReferentiel} is null`,

        // Columns from indicateurCollectiviteTable
        commentaire: indicateurCollectiviteTable.commentaire,
        estConfidentiel: indicateurCollectiviteTable.confidentiel,
        estFavori: indicateurCollectiviteTable.favoris,
        modifiedAt: sql<string>`COALESCE(${indicateurCollectiviteTable.modifiedAt}, ${indicateurDefinitionTable.modifiedAt})`,
        modifiedBy: sqlAuthorOrNull({
          userIdColumn: indicateurCollectiviteTable.modifiedBy,
          prenomColumn: dcpTable.prenom,
          nomColumn: dcpTable.nom,
        }),

        // Columns from other tables
        categories: sql<
          Tag[]
        >`COALESCE(${indicateurCategories.categories}, '{}')`,
        thematiques: sql<
          Tag[]
        >`COALESCE(${indicateurThematiques.thematiques}, '{}')`,
        pilotes: sql<
          PersonneTagOrUser[]
        >`COALESCE(${indicateurPilotes.pilotes}, '{}')`,
        services: sql<Tag[]>`COALESCE(${indicateurServices.services}, '{}')`,
        groupementCollectivites: sql<
          Tag[]
        >`COALESCE(${groupementCollectivites.collectivites}, '{}')`,
        enfants: sql<
          {
            id: number;
            identifiantReferentiel: string;
            titre: string;
            titreCourt: string | null;
          }[]
        >`COALESCE(${indicateurEnfants.enfants}, '{}')`,
        fiches: sql<
          { id: string; titre: string }[]
        >`COALESCE(${indicateurFicheActions.fiches}, '{}')`,
        mesures: sql<
          { id: string; nom: string }[]
        >`COALESCE(${indicateurMesures.mesures}, '{}')`,
        parents: sql<
          {
            id: number;
            identifiantReferentiel: string | null;
            titre: string;
            titreCourt: string | null;
          }[]
        >`COALESCE(${indicateurParents.parents}, '{}')`,
        hasOpenData: sql<boolean>`${indicateurOpenData.hasOpenData} is true`,
        estAgregation: sql<boolean>`${indicateurCategories.estAgregation} is true`,
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
            collectiviteId || 0 // We don't want to have a join
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
      // pilotes
      .leftJoin(
        indicateurPilotes,
        eq(indicateurPilotes.indicateurId, indicateurDefinitionTable.id)
      )
      // services
      .leftJoin(
        indicateurServices,
        eq(indicateurServices.indicateurId, indicateurDefinitionTable.id)
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
        eq(dcpTable.userId, indicateurCollectiviteTable.modifiedBy)
      )
      .where(and(...whereConditions));

    if (queryOptions?.sort) {
      queryOptions.sort.forEach((sort) => {
        const column =
          sort.field === 'titre'
            ? indicateurDefinitionTable.titre
            : indicateurDefinitionTable.identifiantReferentiel;

        const columnWithCollation =
          column === indicateurDefinitionTable.titre
            ? sql`${column} collate numeric_with_case_and_accent_insensitive`
            : column;

        definitionsQuery.orderBy(
          sort.direction === 'asc'
            ? columnWithCollation
            : desc(columnWithCollation)
        );
      });
    }

    definitionsQuery
      .limit(queryOptions.limit)
      .offset((queryOptions.page - 1) * queryOptions.limit);

    const definitionsResult = await definitionsQuery;

    this.logger.log(`${definitionsResult.length} définitions trouvées`);

    const count = definitionsResult[0]?.count ?? 0;

    return {
      data: definitionsResult,
      count,
      page: queryOptions.page,
      pageSize: queryOptions.limit,
      pageCount: Math.ceil(count / queryOptions.limit),
    };
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
