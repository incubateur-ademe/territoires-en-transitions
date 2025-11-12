import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { PersonneTagOrUser } from '@/backend/collectivites/shared/models/personne-tag-or-user.dto';
import { categorieTagTable } from '@/backend/collectivites/tags/categorie-tag.table';
import { indicateurCollectiviteTable } from '@/backend/indicateurs/definitions/indicateur-collectivite.table';
import {
  DefinitionListItem,
  ListDefinitionsOutput,
} from '@/backend/indicateurs/definitions/list-definitions/list-definitions.output';
import { indicateurPiloteTable } from '@/backend/indicateurs/shared/models/indicateur-pilote.table';
import { indicateurSourceMetadonneeTable } from '@/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { indicateurValeurTable } from '@/backend/indicateurs/valeurs/indicateur-valeur.table';
import { ficheActionIndicateurTable } from '@/backend/plans/fiches/shared/models/fiche-action-indicateur.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { normalizeIdentifiantReferentiel } from '@/backend/referentiels/referentiels.utils';
import { thematiqueTable } from '@/backend/shared/thematiques/thematique.table';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { sqlAuthorOrNull } from '@/backend/users/models/author.utils';
import { dcpTable } from '@/backend/users/models/dcp.table';
import { getISOFormatDateQuery } from '@/backend/utils/column.utils';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
  or,
  SQL,
  sql,
  SQLWrapper,
} from 'drizzle-orm';
import { omit } from 'es-toolkit';
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

type IndicateurDefinitionGrandParent = {
  id: number;
  identifiantReferentiel: string | null;
  titre: string;
  titreCourt: string | null;
  parent: null;
};

type IndicateurDefinitionParent = {
  id: number;
  identifiantReferentiel: string | null;
  titre: string;
  titreCourt: string | null;
  parent: IndicateurDefinitionGrandParent | null;
};

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
    const grandParentDefinition = aliasedTable(
      indicateurDefinitionTable,
      'grandParentDefinition'
    );

    const groupeParent = aliasedTable(indicateurGroupeTable, 'groupeParent');
    const groupeGrandParent = aliasedTable(
      indicateurGroupeTable,
      'groupeGrandParent'
    );

    const parentJson = sql<IndicateurDefinitionParent>`json_build_object(
      'id', ${groupeParent.parent},
      'identifiantReferentiel', ${parentDefinition.identifiantReferentiel},
      'titre', ${parentDefinition.titre},
      'titreCourt', ${parentDefinition.titreCourt},
      'parent', CASE WHEN ${groupeGrandParent.parent} IS NULL THEN NULL ELSE json_build_object(
        'id', ${groupeGrandParent.parent},
        'identifiantReferentiel', ${grandParentDefinition.identifiantReferentiel},
        'titre', ${grandParentDefinition.titre},
        'titreCourt', ${grandParentDefinition.titreCourt},
        'parent', NULL
      ) END
    )`;

    return this.databaseService.db
      .select({
        indicateurId: groupeParent.enfant,
        parentId: groupeParent.parent,
        parentJson: parentJson.as('parentJson'),
      })
      .from(groupeParent)
      .leftJoin(parentDefinition, eq(parentDefinition.id, groupeParent.parent))
      .leftJoin(
        groupeGrandParent,
        eq(groupeGrandParent.enfant, groupeParent.parent)
      )
      .leftJoin(
        grandParentDefinition,
        eq(grandParentDefinition.id, groupeGrandParent.parent)
      )
      .groupBy(
        groupeParent.enfant,
        groupeParent.parent,
        parentDefinition.id,
        groupeGrandParent.parent,
        grandParentDefinition.id
      )
      .as('indicateurParents');
  }

  private getIndicateurDefinitionEnfantsQuery(collectiviteId?: number) {
    const enfantDefinition = aliasedTable(
      indicateurDefinitionTable,
      'enfantDefinition'
    );

    const query = this.databaseService.db
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
      .leftJoin(
        groupementTable,
        eq(groupementTable.id, enfantDefinition.groupementId)
      )
      .leftJoin(
        groupementCollectiviteTable,
        eq(groupementCollectiviteTable.groupementId, groupementTable.id)
      );

    // Filtrer les enfants selon leur groupement si une collectivité est spécifiée
    if (collectiviteId) {
      query.where(
        or(
          isNull(enfantDefinition.groupementId),
          eq(groupementCollectiviteTable.collectiviteId, collectiviteId)
        )
      );
    }

    return query.groupBy(indicateurGroupeTable.parent).as('indicateurEnfants');
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

  private getIndicateurCompletedQuery(collectiviteId?: number) {
    return this.databaseService.db
      .select({
        indicateurId: indicateurValeurTable.indicateurId,
        estRempli:
          sql<boolean>`bool_or(${indicateurValeurTable.metadonneeId} is null and (${indicateurValeurTable.objectif} is not null or ${indicateurValeurTable.resultat} is not null))`.as(
            'est_rempli'
          ),
      })
      .from(indicateurValeurTable)
      .where(
        collectiviteId
          ? eq(indicateurValeurTable.collectiviteId, collectiviteId)
          : sql`true`
      )
      .groupBy(indicateurValeurTable.indicateurId)
      .as('indicateurCompleted');
  }

  private getIndicateurDefinitionPilotesQuery(collectiviteId?: number) {
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
      .where(
        collectiviteId
          ? eq(indicateurPiloteTable.collectiviteId, collectiviteId)
          : sql`true`
      )
      .groupBy(indicateurPiloteTable.indicateurId)
      .as('indicateurPilotes');
  }

  private getIndicateurDefinitionServicesQuery(collectiviteId?: number) {
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
      .where(
        collectiviteId
          ? eq(indicateurServiceTagTable.collectiviteId, collectiviteId)
          : sql`true`
      )
      .groupBy(indicateurServiceTagTable.indicateurId)
      .as('indicateurServices');
  }

  private getIndicateurDefinitionFichesQuery(collectiviteId?: number) {
    return this.databaseService.db
      .select({
        indicateurId: ficheActionIndicateurTable.indicateurId,
        ficheIds: sql<
          number[]
        >`array_agg(${ficheActionIndicateurTable.ficheId})`.as(
          'fiche_action_ids'
        ),
        fiches: sql<
          { id: number; titre: string }[]
        >`array_agg(json_build_object('id', ${ficheActionIndicateurTable.ficheId}, 'titre', ${ficheActionTable.titre} ))`.as(
          'fiches'
        ),
        planIds: sql<
          number[]
        >`array_agg(DISTINCT COALESCE(${axeTable.plan}, ${axeTable.id})) FILTER (WHERE ${axeTable.id} IS NOT NULL)`.as(
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
      .where(
        collectiviteId
          ? eq(ficheActionTable.collectiviteId, collectiviteId)
          : sql`true`
      )
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

  async listIndicateurDefinitions(
    indicateurIds: number[]
  ): Promise<IndicateurDefinition[]> {
    const indicateurDefinitions = await this.databaseService.db
      .select()
      .from(indicateurDefinitionTable)
      .where(inArray(indicateurDefinitionTable.id, indicateurIds));

    return indicateurDefinitions;
  }

  async getDefinition(indicateurId: number): Promise<DefinitionListItem> {
    const indicateurDefinitions = await this.listDefinitions({
      filters: { indicateurIds: [indicateurId] },
      queryOptions: { page: 1, limit: 1 },
    });
    if (indicateurDefinitions.data.length === 0) {
      throw new BadRequestException(
        `Indicateur definition not found for id ${indicateurId}`
      );
    }
    return indicateurDefinitions.data[0];
  }

  async listDefinitions(
    { collectiviteId, filters, queryOptions }: ListDefinitionsInput,
    user?: AuthUser
  ): Promise<ListDefinitionsOutput> {
    if (user) {
      await this.permissionService.isAllowed(
        user,
        'indicateurs.definitions.read_public',
        collectiviteId ? ResourceType.COLLECTIVITE : ResourceType.PLATEFORME,
        collectiviteId ?? null
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
    const indicateurFicheActions =
      this.getIndicateurDefinitionFichesQuery(collectiviteId);
    const indicateurEnfants =
      this.getIndicateurDefinitionEnfantsQuery(collectiviteId);
    const indicateurParents = this.getIndicateurDefinitionParentsQuery();
    const indicateurPilotes =
      this.getIndicateurDefinitionPilotesQuery(collectiviteId);
    const indicateurServices =
      this.getIndicateurDefinitionServicesQuery(collectiviteId);
    const indicateurOpenData = this.getIndicateurOpenDataQuery(collectiviteId);
    const indicateurCompleted =
      this.getIndicateurCompletedQuery(collectiviteId);
    const groupementCollectivites = this.getGroupementCollectivitesQuery();

    const whereConditions: (SQLWrapper | SQL | undefined)[] = [];
    const indicateurIdsConditions: (SQLWrapper | SQL)[] = [];

    // Pour les filtres suivants, il faut désactiver l'agrégation pour que ce soit bien
    // les indicateurs enfants qui remontent et non pas leur parents
    const withChildrenActive =
      filters.withChildren === true ||
      filters.identifiantsReferentiel?.length ||
      filters.text ||
      (filters.indicateurIds && filters.indicateurIds.length > 0) === true ||
      filters.mesureId !== undefined ||
      filters.estFavori ||
      filters.ficheIds?.length ||
      filters.utilisateurPiloteIds?.length;

    if (!withChildrenActive) {
      // Exclure les enfants revient à filtrer les indicateurs sans parent
      whereConditions.push(isNull(indicateurParents.parentId));
    }

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

    if (filters.estRempli !== undefined) {
      whereConditions.push(
        eq(indicateurCompleted.estRempli, filters.estRempli)
      );
    }

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
      const searchConditions = [
        sql`unaccent(${indicateurDefinitionTable.titre}) ilike unaccent(${
          '%' + filters.text + '%'
        })`,
        sql`unaccent(${indicateurDefinitionTable.description}) ilike unaccent(${
          '%' + filters.text + '%'
        })`,
      ];

      // Check if text looks like a referentiel identifier (cae, eci, or crte prefix)
      const normalizedIdentifier = normalizeIdentifiantReferentiel(
        filters.text
      );

      if (normalizedIdentifier) {
        searchConditions.push(
          ilike(
            indicateurDefinitionTable.identifiantReferentiel,
            `${normalizedIdentifier}%`
          )
        );
      }

      whereConditions.push(or(...searchConditions));
    }

    const definitionsQuery = this.databaseService.db
      .select({
        ...omit(getTableColumns(indicateurDefinitionTable), [
          'createdAt',
          'modifiedAt',
        ]),

        createdAt: getISOFormatDateQuery(indicateurDefinitionTable.createdAt),

        count: sql<number>`(count(*) over())::int`,

        // TODO: to be removed, deprecated and not documented anymore but still used in the app
        identifiant: indicateurDefinitionTable.identifiantReferentiel,
        estPerso: sql<boolean>`${indicateurDefinitionTable.identifiantReferentiel} is null`,

        // Columns from indicateurCollectiviteTable
        commentaire: indicateurCollectiviteTable.commentaire,
        estConfidentiel: indicateurCollectiviteTable.confidentiel,
        estFavori: indicateurCollectiviteTable.favoris,
        modifiedAt: getISOFormatDateQuery(
          sql`COALESCE(${indicateurCollectiviteTable.modifiedAt}, ${indicateurDefinitionTable.modifiedAt})`
        ),
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
          { id: number; titre: string }[]
        >`COALESCE(${indicateurFicheActions.fiches}, '{}')`,
        mesures: sql<
          { id: string; nom: string }[]
        >`COALESCE(${indicateurMesures.mesures}, '{}')`,
        parent: sql<IndicateurDefinitionParent | null>`COALESCE(${indicateurParents.parentJson}, NULL)`,
        hasOpenData: sql<boolean>`${indicateurOpenData.hasOpenData} is true`,
        estRempli: sql<boolean>`${indicateurCompleted.estRempli} is true`,
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
      // completed (user values)
      .leftJoin(
        indicateurCompleted,
        eq(indicateurCompleted.indicateurId, indicateurDefinitionTable.id)
      )
      .leftJoin(
        dcpTable,
        eq(dcpTable.userId, indicateurCollectiviteTable.modifiedBy)
      )
      .where(and(...whereConditions));

    const sorts = queryOptions.sort ?? [
      { field: 'identifiantReferentiel', direction: 'asc' },
    ];

    sorts.forEach((sort) => {
      if (sort.field === 'estRempli') {
        definitionsQuery.orderBy(
          sort.direction === 'asc'
            ? sql`${indicateurCompleted.estRempli} asc nulls last`
            : sql`${indicateurCompleted.estRempli} desc nulls last`
        );
      } else if (sort.field === 'titre') {
        const column = indicateurDefinitionTable.titre;
        const columnWithCollation = sql`${column} collate numeric_with_case_and_accent_insensitive`;
        definitionsQuery.orderBy(
          sort.direction === 'asc'
            ? columnWithCollation
            : desc(columnWithCollation)
        );
      } else if (sort.field === 'identifiantReferentiel') {
        definitionsQuery.orderBy(
          sort.direction === 'asc'
            ? indicateurDefinitionTable.identifiantReferentiel
            : desc(indicateurDefinitionTable.identifiantReferentiel)
        );
      }
    });

    definitionsQuery
      .limit(queryOptions.limit)
      .offset((queryOptions.page - 1) * queryOptions.limit);

    const definitionsResult = await definitionsQuery;

    this.logger.log(`${definitionsResult.length} définitions trouvées`);

    const count = definitionsResult[0]?.count ?? 0;

    return {
      data: definitionsResult.map((d) => omit(d, ['count'])),
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
      'indicateurs.definitions.read_public',
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
      'indicateurs.definitions.read_public',
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
      'indicateurs.definitions.read_public',
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
      'indicateurs.definitions.read_public',
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

  getSecteurName(indicateurDefinition: ListDefinitionsOutput['data'][number]) {
    const secteur = indicateurDefinition.categories.find((categorie) =>
      categorie.nom.startsWith(this.SECTEUR_CATEGORIE_PREFIX)
    );
    return secteur?.nom?.replace(this.SECTEUR_CATEGORIE_PREFIX, '');
  }

  getSousSecteurName(
    indicateurDefinition: ListDefinitionsOutput['data'][number]
  ) {
    const sousSecteur = indicateurDefinition.categories.find((categorie) =>
      categorie.nom.startsWith(this.SOUS_SECTEUR_CATEGORIE_PREFIX)
    );
    return sousSecteur?.nom?.replace(this.SOUS_SECTEUR_CATEGORIE_PREFIX, '');
  }
}
